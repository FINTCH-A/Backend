import { Controller, Get, Post, Param, Body, UseGuards, ParseIntPipe, Logger, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreditScoreService } from './credit-score.service';
import { CreateCreditScoreDto } from './dto/create-credit-score.dto';
import { CreditScoreResponseDto } from './dto/response/credit-score-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Credit Score')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users/:userId/credit-score')
export class CreditScoreController {
  private readonly logger = new Logger(CreditScoreController.name);

  constructor(private readonly creditScoreService: CreditScoreService) {}

  @Get()
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Obtener el último credit score del usuario' })
  @ApiResponse({ status: 200, type: CreditScoreResponseDto })
  @ApiResponse({ status: 404, description: 'Credit score no encontrado' })
  async findOne(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: User,
  ): Promise<CreditScoreResponseDto> {
    this.logger.log(`📡 Petición GET /users/${userId}/credit-score - Usuario: ${currentUser.email} (role=${currentUser.role})`);

    // Validar permisos: solo el propio usuario o admin/analyst
    if (currentUser.role === 'CUSTOMER' && currentUser.id !== userId) {
      this.logger.warn(`⚠️ Acceso denegado: customer ${currentUser.id} intentó ver credit score de userId=${userId}`);
      throw new ForbiddenException('No tienes permiso para ver este credit score');
    }

    const creditScore = await this.creditScoreService.findLatest(userId);
    this.logger.log(`✅ Credit score enviado al cliente: userId=${userId}, score=${creditScore.score}`);

    return creditScore;
  }

  @Get('history')
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Obtener historial de credit scores del usuario' })
  @ApiResponse({ status: 200, type: [CreditScoreResponseDto] })
  async findHistory(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: User,
  ): Promise<CreditScoreResponseDto[]> {
    this.logger.log(`📡 Petición GET /users/${userId}/credit-score/history - Usuario: ${currentUser.email}`);

    if (currentUser.role === 'CUSTOMER' && currentUser.id !== userId) {
      this.logger.warn(`⚠️ Acceso denegado: customer ${currentUser.id} intentó ver historial de userId=${userId}`);
      throw new ForbiddenException('No tienes permiso para ver este historial');
    }

    const history = await this.creditScoreService.findHistory(userId);
    this.logger.log(`✅ Historial enviado: ${history.length} registros para userId=${userId}`);

    return history;
  }

  @Post()
  @Roles('ADMIN', 'ANALYST')
  @ApiOperation({ summary: 'Crear un nuevo credit score para el usuario' })
  @ApiResponse({ status: 201, type: CreditScoreResponseDto })
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateCreditScoreDto,
  ): Promise<CreditScoreResponseDto> {
    this.logger.log(`📡 Petición POST /users/${userId}/credit-score - score=${dto.score}, riskLevel=${dto.riskLevel}`);

    const creditScore = await this.creditScoreService.create(userId, dto);
    this.logger.log(`✅ Credit score creado exitosamente: id=${creditScore.id}`);

    return creditScore;
  }
}
