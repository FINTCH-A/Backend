import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('ADMIN', 'ANALYST')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas correctamente' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent-activity')
  @Roles('ADMIN', 'ANALYST')
  @ApiOperation({ summary: 'Obtener actividad reciente' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad de registros (default: 5)' })
  async getRecentActivity(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.dashboardService.getRecentActivity(limitNum);
  }

  @Get('alerts')
  @Roles('ADMIN', 'ANALYST')
  @ApiOperation({ summary: 'Obtener alertas del sistema' })
  @ApiResponse({ status: 200, description: 'Alertas obtenidas correctamente' })
  async getAlerts() {
    return this.dashboardService.getAlerts();
  }
}
