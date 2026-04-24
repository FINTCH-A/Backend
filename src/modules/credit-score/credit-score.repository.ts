import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreditScore } from '@prisma/client';

@Injectable()
export class CreditScoreRepository {
  private readonly logger = new Logger(CreditScoreRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findLatestByUser(userId: number): Promise<CreditScore | null> {
    this.logger.debug(`🔍 Repository: Buscando latest credit score para userId=${userId}`);

    const score = await this.prisma.creditScore.findFirst({
      where: { userId },
      orderBy: { evaluatedAt: 'desc' },
    });

    if (score) {
      this.logger.debug(`✅ Repository: Encontrado score id=${score.id}, score=${score.score}`);
    } else {
      this.logger.debug(`❌ Repository: No se encontró score para userId=${userId}`);
    }

    return score;
  }

  async findAllByUser(userId: number): Promise<CreditScore[]> {
    this.logger.debug(`🔍 Repository: Buscando historial de credit scores para userId=${userId}`);

    const scores = await this.prisma.creditScore.findMany({
      where: { userId },
      orderBy: { evaluatedAt: 'desc' },
    });

    this.logger.debug(`📊 Repository: Encontrados ${scores.length} registros para userId=${userId}`);

    return scores;
  }

  async create(userId: number, data: {
    score: number;
    riskLevel: string;
    paymentHistory?: number | null;
    debtRatio?: number | null;
    maxLoanAmount?: number | null;
    notes?: string | null;
    expiresAt: Date;
  }): Promise<CreditScore> {
    this.logger.debug(`🆕 Repository: Creando credit score para userId=${userId}`);

    const score = await this.prisma.creditScore.create({
      data: {
        userId,
        score: data.score,
        riskLevel: data.riskLevel,
        paymentHistory: data.paymentHistory,
        debtRatio: data.debtRatio,
        maxLoanAmount: data.maxLoanAmount,
        notes: data.notes,
        expiresAt: data.expiresAt,
      },
    });

    this.logger.debug(`✅ Repository: Credit score creado id=${score.id}`);

    return score;
  }
}
