import { Injectable } from '@nestjs/common';
import { FamilyInfo, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class FamilyInfoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: number): Promise<FamilyInfo | null> {
    return this.prisma.familyInfo.findUnique({ where: { userId } });
  }

  async upsert(
    userId: number,
    data: Prisma.FamilyInfoCreateWithoutUserInput,
  ): Promise<FamilyInfo> {
    return this.prisma.familyInfo.upsert({
      where:  { userId },
      create: { ...data, user: { connect: { id: userId } } },
      update: data,
    });
  }
}
