import { Injectable, NotFoundException } from '@nestjs/common';
import { RiskAssessment } from '@prisma/client';

import { RiskAssessmentRepository }   from './risk-assessment.repository';
import { CreateRiskAssessmentDto }    from './dto/create-risk-assessment.dto';
import { RiskAssessmentResponseDto }  from './dto/response/risk-assessment-response.dto';

@Injectable()
export class RiskAssessmentService {
  constructor(private readonly repo: RiskAssessmentRepository) {}

  async findLatest(userId: number): Promise<RiskAssessmentResponseDto> {
    const assessment = await this.repo.findLatestByUser(userId);
    if (!assessment) {
      throw new NotFoundException('Evaluación de riesgo no encontrada');
    }
    return this.toResponse(assessment);
  }

  async findHistory(userId: number): Promise<RiskAssessmentResponseDto[]> {
    const assessments = await this.repo.findAllByUser(userId);
    return assessments.map(this.toResponse);
  }

  async create(
    userId: number,
    dto: CreateRiskAssessmentDto,
  ): Promise<RiskAssessmentResponseDto> {
    const assessment = await this.repo.create(userId, {
      score:      dto.score,
      riskLevel:  dto.riskLevel,
      reasons:    dto.reasons    ?? {},
      ipAddress:  dto.ipAddress  ?? null,
      deviceInfo: dto.deviceInfo ?? null,
    });
    return this.toResponse(assessment);
  }

  private getRiskLabel(score: number): string {
    if (score <= 20) return 'MUY BAJO RIESGO';
    if (score <= 40) return 'BAJO RIESGO';
    if (score <= 60) return 'RIESGO MEDIO';
    if (score <= 80) return 'ALTO RIESGO';
    return 'RIESGO CRÍTICO';
  }

  private toResponse(a: RiskAssessment): RiskAssessmentResponseDto {
    const score = Number(a.score);
    return {
      id:         a.id,
      userId:     a.userId,
      score,
      riskLevel:  a.riskLevel,
      riskLabel:  this.getRiskLabel(score),
      approved:   score <= 60,
      reasons:    a.reasons,
      ipAddress:  a.ipAddress,
      deviceInfo: a.deviceInfo,
      createdAt:  a.createdAt,
    };
  }
}
