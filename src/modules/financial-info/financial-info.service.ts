import { Injectable, NotFoundException } from '@nestjs/common';
import { FinancialInfo } from '@prisma/client';

import { FinancialInfoRepository }   from './financial-info.repository';
import { CreateFinancialInfoDto }    from './dto/create-financial-info.dto';
import { UpdateFinancialInfoDto }    from './dto/update-financial-info.dto';
import { FinancialInfoResponseDto }  from './dto/response/financial-info-response.dto';

@Injectable()
export class FinancialInfoService {
  constructor(private readonly repo: FinancialInfoRepository) {}

  async findByUser(userId: number): Promise<FinancialInfoResponseDto> {
    const info = await this.repo.findByUserId(userId);
    if (!info) throw new NotFoundException('Información financiera no encontrada');
    return this.toResponse(info);
  }

  async upsert(
    userId: number,
    dto: CreateFinancialInfoDto | UpdateFinancialInfoDto,
  ): Promise<FinancialInfoResponseDto> {
    const info = await this.repo.upsert(userId, {
      monthlyIncome:      dto.monthlyIncome,
      monthlyExpenses:    dto.monthlyExpenses,
      employmentStatus:   dto.employmentStatus,
      employerName:       dto.employerName       ?? null,
      employerPhone:      dto.employerPhone       ?? null,
      numberOfDependents: dto.numberOfDependents  ?? 0,
      otherIncomeSources: dto.otherIncomeSources  ?? null,
    });
    return this.toResponse(info);
  }

  private toResponse(info: FinancialInfo): FinancialInfoResponseDto {
    const monthly = Number(info.monthlyIncome);
    const expenses = Number(info.monthlyExpenses);
    const other = Number(info.otherIncomeSources ?? 0);

    return {
      id:                 info.id,
      userId:             info.userId,
      monthlyIncome:      monthly,
      monthlyExpenses:    expenses,
      disposableIncome:   monthly + other - expenses,
      employmentStatus:   info.employmentStatus,
      employerName:       info.employerName,
      employerPhone:      info.employerPhone,
      numberOfDependents: info.numberOfDependents,
      otherIncomeSources: info.otherIncomeSources ? Number(info.otherIncomeSources) : null,
      createdAt:          info.createdAt,
      updatedAt:          info.updatedAt,
    };
  }
}
