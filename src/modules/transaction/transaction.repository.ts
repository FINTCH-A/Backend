import { Injectable } from '@nestjs/common';
import { ExternalTransaction, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  getPaginationParams,
  paginate,
  PaginatedResult,
} from '../../common/utils/pagination.util';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryTransactionDto,
  ): Promise<PaginatedResult<ExternalTransaction>> {
    const { page = 1, limit = 10, status } = query;
    const { take, skip } = getPaginationParams(page, limit);

    const where: Prisma.ExternalTransactionWhereInput = {
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.externalTransaction.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.externalTransaction.count({ where }),
    ]);

    return { data, meta: paginate(total, page, limit) };
  }

  async findById(id: number): Promise<ExternalTransaction | null> {
    return this.prisma.externalTransaction.findUnique({ where: { id } });
  }

  async findByPayment(paymentId: number): Promise<ExternalTransaction | null> {
    return this.prisma.externalTransaction.findUnique({ where: { paymentId } });
  }

  async findByExternalId(externalId: string): Promise<ExternalTransaction | null> {
    return this.prisma.externalTransaction.findFirst({ where: { externalId } });
  }

  async create(
    data: Prisma.ExternalTransactionCreateInput,
  ): Promise<ExternalTransaction> {
    return this.prisma.externalTransaction.create({ data });
  }

  async update(
    id: number,
    data: Prisma.ExternalTransactionUpdateInput,
  ): Promise<ExternalTransaction> {
    return this.prisma.externalTransaction.update({ where: { id }, data });
  }
}
