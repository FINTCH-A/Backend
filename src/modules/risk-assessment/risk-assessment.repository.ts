import { Injectable } from '@nestjs/common';
import { RiskAssessment, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class RiskAssessmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatestByUser(userId: number): Promise<RiskAssessment | null> {
    return this.prisma.riskAssessment.findFirst({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByUser(userId: number): Promise<RiskAssessment[]> {
    return this.prisma.riskAssessment.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    userId: number,
    data: Prisma.RiskAssessmentCreateWithoutUserInput,
  ): Promise<RiskAssessment> {
    return this.prisma.riskAssessment.create({
      data: { ...data, user: { connect: { id: userId } } },
    });
  }
}
