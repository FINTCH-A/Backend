import {
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { Address } from '@prisma/client';

  import { AddressRepository }   from './address.repository';
  import { CreateAddressDto }    from './dto/create-address.dto';
  import { UpdateAddressDto }    from './dto/update-address.dto';
  import { AddressResponseDto }  from './dto/response/address-response.dto';

  @Injectable()
  export class AddressService {
    constructor(private readonly repo: AddressRepository) {}

    async findByUser(userId: number): Promise<AddressResponseDto> {
      const address = await this.repo.findByUserId(userId);
      if (!address) {
        throw new NotFoundException('Dirección no encontrada para este usuario');
      }
      return this.toResponse(address);
    }

    async upsert(
      userId: number,
      dto: CreateAddressDto | UpdateAddressDto,
    ): Promise<AddressResponseDto> {
      const address = await this.repo.upsert(userId, {
        country:       dto.country,
        department:    dto.department,
        city:          dto.city,
        district:      dto.district,
        streetAddress: dto.streetAddress,
        postalCode:    dto.postalCode ?? null,
      });
      return this.toResponse(address);
    }

    async remove(userId: number): Promise<void> {
      await this.findByUser(userId);
      await this.repo.delete(userId);
    }

    private toResponse(address: Address): AddressResponseDto {
      return {
        id:            address.id,
        userId:        address.userId,
        country:       address.country,
        department:    address.department,
        city:          address.city,
        district:      address.district,
        streetAddress: address.streetAddress,
        postalCode:    address.postalCode,
        createdAt:     address.createdAt,
        updatedAt:     address.updatedAt,
      };
    }
  }
