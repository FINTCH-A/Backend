import { Injectable } from '@nestjs/common';
import { Prisma, User, UserRole, UserStatus } from '@prisma/client';
import { PrismaService }  from '../../database/prisma/prisma.service';
import { QueryUserDto }   from './dto/query-user.dto';
import {
  getPaginationParams,
  paginate,
  PaginatedResult,
} from '../../common/utils/pagination.util';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUserDto): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, search, role, status } = query;
    const { take, skip } = getPaginationParams(page, limit);

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role   && { role }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName:  { contains: search, mode: 'insensitive' } },
          { email:     { contains: search, mode: 'insensitive' } },
          { dni:       { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: paginate(total, page, limit) };
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findByDni(dni: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { dni } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async softDelete(id: number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data:  { deletedAt: new Date(), status: UserStatus.INACTIVE },
    });
  }

  async updateStatus(id: number, status: UserStatus): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data:  { status },
    });
  }

  async countByRole(): Promise<Record<UserRole, number>> {
    const result = await this.prisma.user.groupBy({
      by:    ['role'],
      where: { deletedAt: null },
      _count: { role: true },
    });

    const counts = {} as Record<UserRole, number>;
    for (const r of result) {
      counts[r.role] = r._count.role;
    }
    return counts;
  }
}
