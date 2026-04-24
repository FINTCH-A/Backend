import { Injectable } from '@nestjs/common';
import { Payment, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  getPaginationParams,
  paginate,
  PaginatedResult,
} from '../../common/utils/pagination.util';
import { QueryPaymentDto } from './dto/query-payment.dto';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: number | undefined,
    query: QueryPaymentDto,
  ): Promise<PaginatedResult<Payment>> {
    const { page = 1, limit = 10, loanId, status } = query;
    const { take, skip } = getPaginationParams(page, limit);

    const where: Prisma.PaymentWhereInput = {
      deletedAt: null,
      ...(userId && { userId }),
      ...(loanId && { loanId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        take,
        skip,
        orderBy: { paymentDate: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, meta: paginate(total, page, limit) };
  }

  async findById(id: number): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
      include: { externalTransaction: true },
    });
  }

  async findByReference(reference: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { reference } });
  }

  async create(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return this.prisma.payment.create({ data });
  }

  async update(
    id: number,
    data: Prisma.PaymentUpdateInput,
  ): Promise<Payment> {
    return this.prisma.payment.update({ where: { id }, data });
  }

  async getTotalPaidByLoan(loanId: number): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where:  { loanId, status: PaymentStatus.COMPLETED, deletedAt: null },
      _sum:   { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }
  async generateReference(): Promise<string> {
    const ts  = Date.now().toString(36).toUpperCase().slice(-6);
    const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `PAY-${ts}-${rnd}`;
  }
}
