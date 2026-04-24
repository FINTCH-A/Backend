import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    UseGuards,
  } from '@nestjs/common';
  import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
  } from '@nestjs/swagger';

  import { RiskAssessmentService }    from './risk-assessment.service';
  import { CreateRiskAssessmentDto }  from './dto/create-risk-assessment.dto';
  import { RiskAssessmentResponseDto } from './dto/response/risk-assessment-response.dto';
  import { JwtAuthGuard }             from '../../common/guards/jwt-auth.guard';
  import { RolesGuard }               from '../../common/guards/roles.guard';
  import { Roles }                    from '../../common/decorators/roles.decorator';

  @ApiTags('Risk Assessment')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Controller('users/:userId/risk-assessment')
  export class RiskAssessmentController {
    constructor(private readonly riskAssessmentService: RiskAssessmentService) {}

    @Get()
    @Roles('ADMIN', 'ANALYST')
    @ApiOperation({ summary: 'Obtener evaluación de riesgo más reciente' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 200, type: RiskAssessmentResponseDto })
    findLatest(
      @Param('userId', ParseIntPipe) userId: number,
    ): Promise<RiskAssessmentResponseDto> {
      return this.riskAssessmentService.findLatest(userId);
    }

    @Get('history')
    @Roles('ADMIN', 'ANALYST')
    @ApiOperation({ summary: 'Historial de evaluaciones de riesgo' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 200, type: [RiskAssessmentResponseDto] })
    findHistory(
      @Param('userId', ParseIntPipe) userId: number,
    ): Promise<RiskAssessmentResponseDto[]> {
      return this.riskAssessmentService.findHistory(userId);
    }

    @Post()
    @Roles('ADMIN', 'ANALYST')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Registrar nueva evaluación de riesgo' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 201, type: RiskAssessmentResponseDto })
    create(
      @Param('userId', ParseIntPipe) userId: number,
      @Body() dto: CreateRiskAssessmentDto,
    ): Promise<RiskAssessmentResponseDto> {
      return this.riskAssessmentService.create(userId, dto);
    }
  }
