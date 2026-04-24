import { Injectable } from '@nestjs/common';
import { PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class PaymentMethodRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: number): Promise<PaymentMethod[]> {
    return this.prisma.paymentMethod.findMany({
      where:   { userId, isActive: true },
      orderBy: { isDefault: 'desc' },
    });
  }

  async findById(id: number): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findUnique({ where: { id } });
  }

  async findByUserAndId(
    userId: number,
    id: number,
  ): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findFirst({
      where: { id, userId },
    });
  }

  async create(data: Prisma.PaymentMethodCreateInput): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.create({ data });
  }

  async update(
    id: number,
    data: Prisma.PaymentMethodUpdateInput,
  ): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.update({ where: { id }, data });
  }

  async clearDefaults(userId: number): Promise<void> {
    await this.prisma.paymentMethod.updateMany({
      where: { userId, isDefault: true },
      data:  { isDefault: false },
    });
  }

  async softDelete(id: number): Promise<void> {
    await this.prisma.paymentMethod.update({
      where: { id },
      data:  { isActive: false },
    });
  }
}
