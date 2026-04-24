import { Injectable } from '@nestjs/common';
import { FinancialInfo, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class FinancialInfoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: number): Promise<FinancialInfo | null> {
    return this.prisma.financialInfo.findUnique({ where: { userId } });
  }

  async upsert(
    userId: number,
    data: Prisma.FinancialInfoCreateWithoutUserInput,
  ): Promise<FinancialInfo> {
    return this.prisma.financialInfo.upsert({
      where:  { userId },
      create: { ...data, user: { connect: { id: userId } } },
      update: data,
    });
  }
}
