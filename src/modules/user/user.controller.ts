import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
  } from '@nestjs/common';
  import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
  } from '@nestjs/swagger';
  import { UserStatus } from '@prisma/client';

  import { UserService }              from './user.service';
  import { CreateUserDto }            from './dto/create-user.dto';
  import { UpdateUserDto }            from './dto/update-user.dto';
  import { QueryUserDto }             from './dto/query-user.dto';
  import { UserResponseDto }          from './dto/response/user-response.dto';
  import { PaginatedUserResponseDto } from './dto/response/paginated-user-response.dto';
  import { JwtAuthGuard }             from '../../common/guards/jwt-auth.guard';
  import { RolesGuard }               from '../../common/guards/roles.guard';
  import { Roles }                    from '../../common/decorators/roles.decorator';

  @ApiTags('Users')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Controller('users')
  export class UserController {
    constructor(private readonly userService: UserService) {}

    // ─── LISTAR ────────────────────────────────────────────────

    @Get()
    @Roles('ADMIN', 'ANALYST')
    @ApiOperation({ summary: 'Listar usuarios con paginación y filtros' })
    @ApiResponse({ status: 200, type: PaginatedUserResponseDto })
    findAll(@Query() query: QueryUserDto): Promise<PaginatedUserResponseDto> {
      return this.userService.findAll(query);
    }

    // ─── STATS ─────────────────────────────────────────────────

    @Get('stats')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Estadísticas de usuarios por rol' })
    getStats() {
      return this.userService.getStats();
    }

    // ─── BUSCAR POR ID ─────────────────────────────────────────

    @Get(':id')
    @Roles('ADMIN', 'ANALYST')
    @ApiOperation({ summary: 'Obtener usuario por ID' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, type: UserResponseDto })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    findOne(
      @Param('id', ParseIntPipe) id: number,
    ): Promise<UserResponseDto> {
      return this.userService.findOne(id);
    }

    // ─── CREAR ─────────────────────────────────────────────────

    @Post()
    @Roles('ADMIN')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Crear usuario (solo ADMIN)' })
    @ApiResponse({ status: 201, type: UserResponseDto })
    @ApiResponse({ status: 409, description: 'Email o DNI ya registrado' })
    create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
      return this.userService.create(dto);
    }

    // ─── ACTUALIZAR ────────────────────────────────────────────

    @Patch(':id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Actualizar usuario' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, type: UserResponseDto })
    update(
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: UpdateUserDto,
    ): Promise<UserResponseDto> {
      return this.userService.update(id, dto);
    }

    // ─── CAMBIAR ESTADO ────────────────────────────────────────

    @Patch(':id/status')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Cambiar estado del usuario' })
    @ApiParam({ name: 'id', type: Number })
    updateStatus(
      @Param('id', ParseIntPipe) id: number,
      @Body('status') status: UserStatus,
    ): Promise<UserResponseDto> {
      return this.userService.updateStatus(id, status);
    }

    // ─── ELIMINAR ──────────────────────────────────────────────

    @Delete(':id')
    @Roles('ADMIN')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 204 })
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return this.userService.remove(id);
    }
  }
