import { Injectable } from '@nestjs/common';
import { Installment, InstallmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  getPaginationParams,
  paginate,
  PaginatedResult,
} from '../../common/utils/pagination.util';

@Injectable()
export class InstallmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByLoan(
    loanId: number,
    page = 1,
    limit = 60,
  ): Promise<PaginatedResult<Installment>> {
    const { take, skip } = getPaginationParams(page, limit);

    const where = { loanId, deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.installment.findMany({
        where,
        take,
        skip,
        orderBy: { installmentNumber: 'asc' },
      }),
      this.prisma.installment.count({ where }),
    ]);

    return { data, meta: paginate(total, page, limit) };
  }

  async findById(id: number): Promise<Installment | null> {
    return this.prisma.installment.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findPendingByLoan(loanId: number): Promise<Installment[]> {
    return this.prisma.installment.findMany({
      where: {
        loanId,
        status: {
          in: [InstallmentStatus.PENDING, InstallmentStatus.OVERDUE],
        },
        deletedAt: null,
      },
      orderBy: { installmentNumber: 'asc' },
    });
  }

  async findNextDue(loanId: number): Promise<Installment | null> {
    return this.prisma.installment.findFirst({
      where: {
        loanId,
        status:    { in: [InstallmentStatus.PENDING, InstallmentStatus.OVERDUE] },
        deletedAt: null,
      },
      orderBy: { installmentNumber: 'asc' },
    });
  }

  async update(
    id: number,
    data: Prisma.InstallmentUpdateInput,
  ): Promise<Installment> {
    return this.prisma.installment.update({ where: { id }, data });
  }

  async markOverdue(): Promise<number> {
    const result = await this.prisma.installment.updateMany({
      where: {
        status:    InstallmentStatus.PENDING,
        dueDate:   { lt: new Date() },
        deletedAt: null,
      },
      data: { status: InstallmentStatus.OVERDUE },
    });
    return result.count;
  }
}
