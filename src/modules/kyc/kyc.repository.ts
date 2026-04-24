import { Injectable } from '@nestjs/common';
import { KYC, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class KycRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: number): Promise<KYC | null> {
    return this.prisma.kYC.findUnique({ where: { userId } });
  }

  async upsert(
    userId: number,
    data: Partial<Prisma.KYCCreateInput>,
  ): Promise<KYC> {
    return this.prisma.kYC.upsert({
      where:  { userId },
      create: { ...data, user: { connect: { id: userId } } } as Prisma.KYCCreateInput,
      update: data,
    });
  }

  async verify(userId: number): Promise<KYC> {
    return this.prisma.kYC.update({
      where: { userId },
      data:  { verified: true, verifiedAt: new Date() },
    });
  }
}
