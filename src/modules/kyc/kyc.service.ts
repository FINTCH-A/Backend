import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { KYC } from '@prisma/client';

  import { KycRepository }  from './kyc.repository';
  import { UploadKycDto }   from './dto/upload-kyc.dto';
  import { KycResponseDto } from './dto/response/kyc-response.dto';

  @Injectable()
  export class KycService {
    constructor(private readonly repo: KycRepository) {}

    async findByUser(userId: number): Promise<KycResponseDto> {
      const kyc = await this.repo.findByUserId(userId);
      if (!kyc) throw new NotFoundException('KYC no encontrado para este usuario');
      return this.toResponse(kyc);
    }

    async upload(userId: number, dto: UploadKycDto): Promise<KycResponseDto> {
      if (!dto.documentFront && !dto.documentBack && !dto.selfie) {
        throw new BadRequestException('Debes subir al menos un documento');
      }
      const kyc = await this.repo.upsert(userId, {
        documentFront: dto.documentFront ?? undefined,
        documentBack:  dto.documentBack  ?? undefined,
        selfie:        dto.selfie        ?? undefined,
      });
      return this.toResponse(kyc);
    }

    async verify(userId: number): Promise<KycResponseDto> {
      const kyc = await this.repo.findByUserId(userId);
      if (!kyc) throw new NotFoundException('KYC no encontrado');
      if (kyc.verified) throw new BadRequestException('El KYC ya fue verificado');
      const updated = await this.repo.verify(userId);
      return this.toResponse(updated);
    }

    private toResponse(kyc: KYC): KycResponseDto {
      return {
        id:            kyc.id,
        userId:        kyc.userId,
        documentFront: kyc.documentFront,
        documentBack:  kyc.documentBack,
        selfie:        kyc.selfie,
        verified:      kyc.verified,
        verifiedAt:    kyc.verifiedAt,
      };
    }
  }
