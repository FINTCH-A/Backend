import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
  } from '@nestjs/swagger';
  import { Request } from 'express';
  import { User }    from '@prisma/client';

  import { AuthService }       from './auth.service';
  import { RegisterDto }       from './dto/register.dto';
  import { LoginDto }          from './dto/login.dto';
  import { RefreshTokenDto }   from './dto/refresh-token.dto';
  import { ChangePasswordDto } from './dto/change-password.dto';
  import { AuthTokensDto }     from './dto/response/auth-tokens.dto';
  import { MeResponseDto }     from './dto/response/me-response.dto';
  import { Public }            from '../../common/decorators/public.decorator';
  import { CurrentUser }       from '../../common/decorators/current-user.decorator';
  import { JwtAuthGuard }      from '../../common/guards/jwt-auth.guard';

  @ApiTags('Auth')
  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService) {}

    // ─── REGISTER ──────────────────────────────────────────────

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Registrar nuevo cliente' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, type: AuthTokensDto })
    @ApiResponse({ status: 409, description: 'Email o DNI ya registrado' })
    register(
      @Body() dto: RegisterDto,
      @Req() req: Request,
    ): Promise<AuthTokensDto> {
      return this.authService.register(dto, this.getIp(req));
    }

    // ─── LOGIN ─────────────────────────────────────────────────

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Iniciar sesión' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, type: AuthTokensDto })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
    @ApiResponse({ status: 403, description: 'Cuenta bloqueada o suspendida' })
    login(
      @Body() dto: LoginDto,
      @Req() req: Request,
    ): Promise<AuthTokensDto> {
      return this.authService.login(dto, this.getIp(req));
    }

    // ─── REFRESH ───────────────────────────────────────────────

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Renovar access token (rotación de refresh token)' })
    @ApiBody({ type: RefreshTokenDto })
    @ApiResponse({ status: 200, type: AuthTokensDto })
    @ApiResponse({ status: 401, description: 'Refresh token inválido' })
    refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensDto> {
      return this.authService.refresh(dto.refreshToken);
    }

    // ─── LOGOUT ────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Cerrar sesión y revocar refresh token' })
    @ApiBody({ type: RefreshTokenDto })
    @ApiResponse({ status: 204 })
    logout(
      @CurrentUser() user: User,
      @Body() dto: RefreshTokenDto,
      @Req() req: Request,
    ): Promise<void> {
      return this.authService.logout(user.id, dto.refreshToken, this.getIp(req));
    }

    // ─── LOGOUT ALL ────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post('logout-all')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Cerrar todas las sesiones activas' })
    @ApiResponse({ status: 204 })
    logoutAll(@CurrentUser() user: User): Promise<void> {
      return this.authService.logoutAll(user.id);
    }

    // ─── ME ────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
    @ApiResponse({ status: 200, type: MeResponseDto })
    me(@CurrentUser() user: User): MeResponseDto {
      return this.authService.getMe(user);
    }

    // ─── CHANGE PASSWORD ───────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Cambiar contraseña' })
    @ApiBody({ type: ChangePasswordDto })
    @ApiResponse({ status: 204 })
    @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta' })
    changePassword(
      @CurrentUser() user: User,
      @Body() dto: ChangePasswordDto,
      @Req() req: Request,
    ): Promise<void> {
      return this.authService.changePassword(user.id, dto, this.getIp(req));
    }

    // ─── HELPER ────────────────────────────────────────────────

    private getIp(req: Request): string {
      return (
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        'unknown'
      );
    }
  }
