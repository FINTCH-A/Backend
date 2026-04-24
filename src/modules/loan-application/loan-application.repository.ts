import { Injectable } from '@nestjs/common';
import { ApplicationStatus, LoanApplication, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  getPaginationParams,
  paginate,
  PaginatedResult,
} from '../../common/utils/pagination.util';

export interface LoanApplicationFilter {
  page?:   number;
  limit?:  number;
  userId?: number;
  status?: ApplicationStatus;
}

@Injectable()
export class LoanApplicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filter: LoanApplicationFilter,
  ): Promise<PaginatedResult<LoanApplication>> {
    const { page = 1, limit = 10, userId, status } = filter;
    const { take, skip } = getPaginationParams(page, limit);

    const where: Prisma.LoanApplicationWhereInput = {
      ...(userId && { userId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where,
        take,
        skip,
        orderBy:  { createdAt: 'desc' },
        include:  { requestLocation: true },
      }),
      this.prisma.loanApplication.count({ where }),
    ]);

    return { data, meta: paginate(total, page, limit) };
  }

  async findById(id: number): Promise<LoanApplication | null> {
    return this.prisma.loanApplication.findUnique({
      where:   { id },
      include: { requestLocation: true },
    });
  }

  async findByUserAndId(
    userId: number,
    id: number,
  ): Promise<LoanApplication | null> {
    return this.prisma.loanApplication.findFirst({
      where:   { id, userId },
      include: { requestLocation: true },
    });
  }

  async create(
    data: Prisma.LoanApplicationCreateInput,
  ): Promise<LoanApplication> {
    return this.prisma.loanApplication.create({
      data,
      include: { requestLocation: true },
    });
  }

  async update(
    id: number,
    data: Prisma.LoanApplicationUpdateInput,
  ): Promise<LoanApplication> {
    return this.prisma.loanApplication.update({
      where:   { id },
      data,
      include: { requestLocation: true },
    });
  }

  async countActiveByUser(userId: number): Promise<number> {
    return this.prisma.loanApplication.count({
      where: {
        userId,
        status: {
          in: [
            ApplicationStatus.DRAFT,
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.UNDER_REVIEW,
          ],
        },
      },
    });
  }

  // ============================================================
  // ✅ NUEVO MÉTODO: Contar solicitudes por estado
  // ============================================================
  async countByStatus(status: ApplicationStatus): Promise<number> {
    return this.prisma.loanApplication.count({
      where: { status },
    });
  }
}
