import { Injectable, NotFoundException } from '@nestjs/common';
import { FamilyInfo } from '@prisma/client';

import { FamilyInfoRepository }  from './family-info.repository';
import { CreateFamilyInfoDto }   from './dto/create-family-info.dto';
import { UpdateFamilyInfoDto }   from './dto/update-family-info.dto';
import { FamilyInfoResponseDto } from './dto/response/family-info-response.dto';

@Injectable()
export class FamilyInfoService {
  constructor(private readonly repo: FamilyInfoRepository) {}

  async findByUser(userId: number): Promise<FamilyInfoResponseDto> {
    const info = await this.repo.findByUserId(userId);
    if (!info) throw new NotFoundException('Información familiar no encontrada');
    return this.toResponse(info);
  }

  async upsert(
    userId: number,
    dto: CreateFamilyInfoDto | UpdateFamilyInfoDto,
  ): Promise<FamilyInfoResponseDto> {
    const info = await this.repo.upsert(userId, {
      maritalStatus:    dto.maritalStatus,
      numberOfChildren: dto.numberOfChildren ?? 0,
      housingType:      dto.housingType,
    });
    return this.toResponse(info);
  }

  private toResponse(info: FamilyInfo): FamilyInfoResponseDto {
    return {
      id:               info.id,
      userId:           info.userId,
      maritalStatus:    info.maritalStatus,
      numberOfChildren: info.numberOfChildren,
      housingType:      info.housingType,
      createdAt:        info.createdAt,
      updatedAt:        info.updatedAt,
    };
  }
}
