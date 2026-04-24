import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreditScore } from '@prisma/client';

import { CreditScoreRepository }  from './credit-score.repository';
import { CreateCreditScoreDto }   from './dto/create-credit-score.dto';
import { CreditScoreResponseDto } from './dto/response/credit-score-response.dto';

@Injectable()
export class CreditScoreService {
  private readonly logger = new Logger(CreditScoreService.name);

  constructor(private readonly repo: CreditScoreRepository) {}

  async findLatest(userId: number): Promise<CreditScoreResponseDto> {
    this.logger.log(`🔍 Buscando credit score para userId=${userId}`);

    const score = await this.repo.findLatestByUser(userId);
    if (!score) {
      this.logger.warn(`⚠️ No se encontró credit score para userId=${userId}`);
      throw new NotFoundException('Score crediticio no encontrado para este usuario');
    }

    this.logger.log(`✅ Credit score encontrado para userId=${userId}: score=${score.score}, riskLevel=${score.riskLevel}`);
    return this.toResponse(score);
  }

  async findHistory(userId: number): Promise<CreditScoreResponseDto[]> {
    this.logger.log(`🔍 Buscando historial de credit scores para userId=${userId}`);

    const scores = await this.repo.findAllByUser(userId);
    this.logger.log(`📊 Encontrados ${scores.length} registros de credit score para userId=${userId}`);

    if (scores.length > 0) {
      const details = scores.map(s => `score=${s.score}, risk=${s.riskLevel}, fecha=${s.evaluatedAt.toISOString()}`).join(' | ');
      this.logger.log(`📋 Detalles: ${details}`);
    } else {
      this.logger.warn(`⚠️ No se encontró historial de credit score para userId=${userId}`);
    }

    // ✅ CORRECCIÓN: Usar bind para mantener el contexto de this
    return scores.map((score) => this.toResponse(score));
  }

  async create(
    userId: number,
    dto: CreateCreditScoreDto,
  ): Promise<CreditScoreResponseDto> {
    this.logger.log(`🆕 Creando nuevo credit score para userId=${userId}`);
    this.logger.log(`📝 Datos recibidos: score=${dto.score}, riskLevel=${dto.riskLevel}, maxLoanAmount=${dto.maxLoanAmount}`);

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6); // Expira en 6 meses
    this.logger.log(`📅 Fecha de expiración: ${expiresAt.toISOString()}`);

    const score = await this.repo.create(userId, {
      score: dto.score,
      riskLevel: dto.riskLevel,
      paymentHistory: dto.paymentHistory ?? null,
      debtRatio: dto.debtRatio ?? null,
      maxLoanAmount: dto.maxLoanAmount ?? null,
      notes: dto.notes ?? null,
      expiresAt,
    });

    this.logger.log(`✅ Credit score creado: id=${score.id}, userId=${userId}, score=${score.score}`);

    return this.toResponse(score);
  }

  private getScoreLabel(score: number): string {
    if (score >= 750) return 'EXCELENTE';
    if (score >= 700) return 'MUY BUENO';
    if (score >= 650) return 'BUENO';
    if (score >= 600) return 'REGULAR';
    if (score >= 550) return 'DEFICIENTE';
    return 'MUY DEFICIENTE';
  }

  private getRiskLabel(riskLevel: string): string {
    const riskMap: Record<string, string> = {
      LOW: 'Riesgo Bajo',
      MEDIUM: 'Riesgo Medio',
      HIGH: 'Riesgo Alto',
      VERY_HIGH: 'Riesgo Muy Alto',
    };
    return riskMap[riskLevel] || riskLevel;
  }

  // ✅ CORRECCIÓN: Método sin usar this.logger directamente o con try/catch
  private toResponse(score: CreditScore): CreditScoreResponseDto {
    const isExpired = score.expiresAt ? new Date() > score.expiresAt : false;

    // Usar try/catch para evitar errores silenciosos
    try {
      return {
        id: score.id,
        userId: score.userId,
        score: score.score,
        riskLevel: score.riskLevel,
        riskLabel: this.getRiskLabel(score.riskLevel),
        scoreLabel: this.getScoreLabel(score.score),
        paymentHistory: score.paymentHistory ? Number(score.paymentHistory) : null,
        debtRatio: score.debtRatio ? Number(score.debtRatio) : null,
        maxLoanAmount: score.maxLoanAmount ? Number(score.maxLoanAmount) : null,
        notes: score.notes,
        evaluatedAt: score.evaluatedAt,
        expiresAt: score.expiresAt,
        isExpired,
        createdAt: score.createdAt,
      };
    } catch (error) {
      // Log del error sin usar this.logger (o usarlo con cuidado)
      console.error('Error transforming credit score:', error);
      throw error;
    }
  }
}
