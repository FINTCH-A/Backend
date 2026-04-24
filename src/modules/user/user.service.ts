import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
  } from '@nestjs/common';
  import * as bcrypt from 'bcrypt';
  import { ConfigService } from '@nestjs/config';
  import { User, UserStatus } from '@prisma/client';

  import { UserRepository }         from './user.repository';
  import { CreateUserDto }          from './dto/create-user.dto';
  import { UpdateUserDto }          from './dto/update-user.dto';
  import { QueryUserDto }           from './dto/query-user.dto';
  import { UserResponseDto }        from './dto/response/user-response.dto';
  import { PaginatedUserResponseDto } from './dto/response/paginated-user-response.dto';

  @Injectable()
  export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
      private readonly repo:   UserRepository,
      private readonly config: ConfigService,
    ) {}

    // ─── LISTAR ──────────────────────────────────────────────────

    async findAll(query: QueryUserDto): Promise<PaginatedUserResponseDto> {
      const result = await this.repo.findAll(query);
      return {
        data: result.data.map(this.toResponse),
        meta: result.meta,
      };
    }

    // ─── BUSCAR POR ID ────────────────────────────────────────────

    async findOne(id: number): Promise<UserResponseDto> {
      const user = await this.repo.findById(id);
      if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);
      return this.toResponse(user);
    }

    // ─── CREAR ────────────────────────────────────────────────────

    async create(dto: CreateUserDto): Promise<UserResponseDto> {
      const [byEmail, byDni] = await Promise.all([
        this.repo.findByEmail(dto.email),
        this.repo.findByDni(dto.dni),
      ]);

      if (byEmail) throw new ConflictException('El correo ya está registrado');
      if (byDni)   throw new ConflictException('El DNI ya está registrado');

      const rounds = this.config.get<number>('BCRYPT_ROUNDS', 12);
      const hashed = await bcrypt.hash(dto.password, rounds);

      const user = await this.repo.create({
        firstName:   dto.firstName.trim(),
        lastName:    dto.lastName.trim(),
        dni:         dto.dni.trim(),
        email:       dto.email.toLowerCase().trim(),
        phone:       dto.phone.trim(),
        password:    hashed,
        dateOfBirth: new Date(dto.dateOfBirth),
        role:        dto.role,
      });

      this.logger.log(`Usuario creado: ${user.email} (id=${user.id})`);
      return this.toResponse(user);
    }

    // ─── ACTUALIZAR ───────────────────────────────────────────────

    async update(id: number, dto: UpdateUserDto): Promise<UserResponseDto> {
      await this.findOne(id);

      const user = await this.repo.update(id, {
        ...(dto.firstName   && { firstName:   dto.firstName.trim() }),
        ...(dto.lastName    && { lastName:    dto.lastName.trim() }),
        ...(dto.phone       && { phone:       dto.phone.trim() }),
        ...(dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) }),
        ...(dto.status      && { status:      dto.status }),
      });

      return this.toResponse(user);
    }

    // ─── CAMBIAR ESTADO ───────────────────────────────────────────

    async updateStatus(id: number, status: UserStatus): Promise<UserResponseDto> {
      await this.findOne(id);
      const user = await this.repo.updateStatus(id, status);
      return this.toResponse(user);
    }

    // ─── ELIMINAR (soft delete) ────────────────────────────────────

    async remove(id: number): Promise<void> {
      await this.findOne(id);
      await this.repo.softDelete(id);
      this.logger.log(`Usuario eliminado (soft): id=${id}`);
    }

    // ─── STATS ───────────────────────────────────────────────────

    async getStats() {
      const byRole = await this.repo.countByRole();
      return { byRole };
    }

    // ─── MAPPER ──────────────────────────────────────────────────

    private toResponse(user: User): UserResponseDto {
      return {
        id:           user.id,
        firstName:    user.firstName,
        lastName:     user.lastName,
        dni:          user.dni,
        email:        user.email,
        phone:        user.phone,
        dateOfBirth:  user.dateOfBirth,
        role:         user.role,
        status:       user.status,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        lastLogin:    user.lastLogin,
        createdAt:    user.createdAt,
        updatedAt:    user.updatedAt,
      };
    }
  }
