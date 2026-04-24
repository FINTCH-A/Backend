import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService }     from '@nestjs/jwt';
  import { ConfigService }  from '@nestjs/config';
  import * as bcrypt        from 'bcrypt';

  import { AuthRepository }    from './auth.repository';
  import { RegisterDto }       from './dto/register.dto';
  import { LoginDto }          from './dto/login.dto';
  import { ChangePasswordDto } from './dto/change-password.dto';
  import { AuthTokensDto }     from './dto/response/auth-tokens.dto';
  import { MeResponseDto }     from './dto/response/me-response.dto';
  import { JwtPayload }        from '../../common/interfaces/jwt-payload.interface';
  import { AuditAction, User, UserStatus } from '@prisma/client';
  import { PrismaService }     from '../../database/prisma/prisma.service';

  const MAX_FAILED_ATTEMPTS = 5;
  const LOCK_MINUTES        = 15;

  @Injectable()
  export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
      private readonly repo:    AuthRepository,
      private readonly jwt:     JwtService,
      private readonly config:  ConfigService,
      private readonly prisma:  PrismaService,
    ) {}

    // ─── REGISTER ────────────────────────────────────────────────

    async register(dto: RegisterDto, ip?: string): Promise<AuthTokensDto> {
      const [byEmail, byDni] = await Promise.all([
        this.repo.findByEmail(dto.email),
        this.repo.findByDni(dto.dni),
      ]);

      if (byEmail) throw new ConflictException('El correo ya está registrado');
      if (byDni)   throw new ConflictException('El DNI ya está registrado');

      const rounds = 12; // Valor fijo para probar
      const hashed = await bcrypt.hash(dto.password, rounds);

      const user = await this.repo.create({
        firstName:   dto.firstName.trim(),
        lastName:    dto.lastName.trim(),
        dni:         dto.dni.trim(),
        email:       dto.email.toLowerCase().trim(),
        phone:       dto.phone.trim(),
        password:    hashed,
        dateOfBirth: new Date(dto.dateOfBirth),
      });

      // Audit
      await this.writeAudit(user.id, AuditAction.CREATE, 'User', user.id, ip);

      this.logger.log(`Nuevo usuario registrado: ${user.email} (id=${user.id})`);

      return this.generateAndSaveTokens(user);
    }

    // ─── LOGIN ───────────────────────────────────────────────────

    async login(dto: LoginDto, ip?: string): Promise<AuthTokensDto> {
      const user = await this.repo.findByEmail(dto.email);

      if (!user) throw new UnauthorizedException('Credenciales inválidas');

      // Verificar bloqueo
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const minutes = Math.ceil(
          (user.lockedUntil.getTime() - Date.now()) / 60000,
        );
        throw new ForbiddenException(
          `Cuenta bloqueada. Intenta en ${minutes} minutos`,
        );
      }

      // Verificar estado
      if (user.status === UserStatus.SUSPENDED) {
        throw new ForbiddenException('Cuenta suspendida. Contacta a soporte');
      }
      if (user.status === UserStatus.INACTIVE) {
        throw new ForbiddenException('Cuenta inactiva');
      }

      // Verificar contraseña
      const passwordMatch = await bcrypt.compare(dto.password, user.password);

      if (!passwordMatch) {
        const attempts   = user.failedLoginAttempts + 1;
        const lockedUntil =
          attempts >= MAX_FAILED_ATTEMPTS
            ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
            : null;

        await this.repo.updateFailedAttempts(user.id, attempts, lockedUntil);

        if (lockedUntil) {
          throw new ForbiddenException(
            `Demasiados intentos. Cuenta bloqueada ${LOCK_MINUTES} minutos`,
          );
        }

        const remaining = MAX_FAILED_ATTEMPTS - attempts;
        throw new UnauthorizedException(
          `Credenciales inválidas. Intentos restantes: ${remaining}`,
        );
      }

      await this.repo.updateLastLogin(user.id);
      await this.writeAudit(user.id, AuditAction.LOGIN, 'User', user.id, ip);

      this.logger.log(`Login exitoso: ${user.email} (id=${user.id})`);

      return this.generateAndSaveTokens(user);
    }

    // ─── REFRESH (rotación obligatoria) ──────────────────────────

    async refresh(refreshToken: string): Promise<AuthTokensDto> {
      const stored = await this.repo.findRefreshToken(refreshToken);

      if (!stored) {
        throw new UnauthorizedException('Refresh token inválido o expirado');
      }

      const user = stored.user;

      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Usuario no disponible');
      }

      // Rotación: revoca el token actual y emite uno nuevo
      await this.repo.revokeRefreshToken(refreshToken);

      return this.generateAndSaveTokens(user);
    }

    // ─── LOGOUT ──────────────────────────────────────────────────

    async logout(userId: number, refreshToken: string, ip?: string): Promise<void> {
      await this.repo.revokeRefreshToken(refreshToken);
      await this.writeAudit(userId, AuditAction.LOGOUT, 'User', userId, ip);
    }

    // ─── LOGOUT ALL (cierra todas las sesiones) ───────────────────

    async logoutAll(userId: number): Promise<void> {
      await this.repo.revokeAllUserTokens(userId);
    }

    // ─── ME ──────────────────────────────────────────────────────

    getMe(user: User): MeResponseDto {
      return {
        id:           user.id,
        email:        user.email,
        firstName:    user.firstName,
        lastName:     user.lastName,
        dni:          user.dni,
        phone:        user.phone,
        role:         user.role,
        status:       user.status,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        lastLogin:    user.lastLogin,
        createdAt:    user.createdAt,
      };
    }

    // ─── CHANGE PASSWORD ─────────────────────────────────────────

    async changePassword(
      userId: number,
      dto: ChangePasswordDto,
      ip?: string,
    ): Promise<void> {
      const user = await this.repo.findById(userId);
      if (!user) throw new UnauthorizedException();

      const match = await bcrypt.compare(dto.currentPassword, user.password);
      if (!match) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }

      if (dto.currentPassword === dto.newPassword) {
        throw new BadRequestException(
          'La nueva contraseña debe ser diferente a la actual',
        );
      }

      const rounds = this.config.get<number>('BCRYPT_ROUNDS', 12);
      const hashed = await bcrypt.hash(dto.newPassword, rounds);

      await this.repo.updatePassword(userId, hashed);
      await this.repo.revokeAllUserTokens(userId);
      await this.writeAudit(userId, AuditAction.UPDATE, 'User', userId, ip);
    }

    // ─── VALIDATE (usado por JwtStrategy) ────────────────────────

    async validateUserById(id: number): Promise<User | null> {
      const user = await this.repo.findById(id);
      if (!user || user.deletedAt || user.status === UserStatus.SUSPENDED) {
        return null;
      }
      return user;
    }

    // ─── HELPERS PRIVADOS ────────────────────────────────────────

    private async generateAndSaveTokens(user: User): Promise<AuthTokensDto> {
      const payload: JwtPayload = {
        sub:   user.id,
        email: user.email,
        role:  user.role,
      };

      const [accessToken, refreshToken] = await Promise.all([
        this.jwt.signAsync(payload, {
          secret:    this.config.get('JWT_ACCESS_SECRET'),
          expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m'),
        }),
        this.jwt.signAsync(payload, {
          secret:    this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRES', '7d'),
        }),
      ]);

      await this.repo.saveRefreshToken(user.id, refreshToken);

      return {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m'),
      };
    }

    private async writeAudit(
      userId: number,
      action: AuditAction,
      entity: string,
      entityId: number,
      ip?: string,
    ): Promise<void> {
      try {
        await this.prisma.auditLog.create({
          data: { userId, action, entity, entityId, ipAddress: ip ?? null },
        });
      } catch {
        this.logger.warn('No se pudo escribir audit log');
      }
    }
  }
