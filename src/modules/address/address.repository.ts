import { Injectable } from '@nestjs/common';
import { Address, Prisma } from '@prisma/client';
import { PrismaService }   from '../../database/prisma/prisma.service';

@Injectable()
export class AddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: number): Promise<Address | null> {
    return this.prisma.address.findUnique({ where: { userId } });
  }

  async create(data: Prisma.AddressCreateInput): Promise<Address> {
    return this.prisma.address.create({ data });
  }

  async upsert(
    userId: number,
    data: Prisma.AddressCreateWithoutUserInput,
  ): Promise<Address> {
    return this.prisma.address.upsert({
      where:  { userId },
      create: { ...data, user: { connect: { id: userId } } },
      update: data,
    });
  }

  async delete(userId: number): Promise<void> {
    await this.prisma.address.delete({ where: { userId } });
  }
}
