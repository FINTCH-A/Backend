import { Injectable } from '@nestjs/common';
import { LedgerEntry, LedgerType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  getPaginationParams,
  paginate,
  PaginatedResult,
} from '../../common/utils/pagination.util';

export interface LedgerFilter {
  page?:   number;
  limit?:  number;
  userId?: number;
  loanId?: number;
  type?:   LedgerType;
}

@Injectable()
export class LedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: LedgerFilter): Promise<PaginatedResult<LedgerEntry>> {
    const { page = 1, limit = 20, userId, loanId, type } = filter;
    const { take, skip } = getPaginationParams(page, limit);

    const where: Prisma.LedgerEntryWhereInput = {
      ...(userId && { userId }),
      ...(loanId && { loanId }),
      ...(type   && { type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ledgerEntry.count({ where }),
    ]);

    return { data, meta: paginate(total, page, limit) };
  }

  async findById(id: number): Promise<LedgerEntry | null> {
    return this.prisma.ledgerEntry.findUnique({ where: { id } });
  }

  async create(data: Prisma.LedgerEntryCreateInput): Promise<LedgerEntry> {
    return this.prisma.ledgerEntry.create({ data });
  }

  async sumByUserAndType(
    userId: number,
    type: LedgerType,
  ): Promise<number> {
    const result = await this.prisma.ledgerEntry.aggregate({
      where: { userId, type },
      _sum:  { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  async getBalanceByLoan(loanId: number): Promise<Record<string, number>> {
    const entries = await this.prisma.ledgerEntry.groupBy({
      by:    ['type'],
      where: { loanId },
      _sum:  { amount: true },
    });

    const balance: Record<string, number> = {};
    for (const e of entries) {
      balance[e.type] = Number(e._sum.amount ?? 0);
    }
    return balance;
  }
}
