import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { PaymentMethod } from '@prisma/client';

  import { PaymentMethodRepository }   from './payment-method.repository';
  import { CreatePaymentMethodDto }    from './dto/create-payment-method.dto';
  import { UpdatePaymentMethodDto }    from './dto/update-payment-method.dto';
  import { PaymentMethodResponseDto }  from './dto/response/payment-method-response.dto';

  @Injectable()
  export class PaymentMethodService {
    constructor(private readonly repo: PaymentMethodRepository) {}

    async findAllByUser(userId: number): Promise<PaymentMethodResponseDto[]> {
      const methods = await this.repo.findAllByUser(userId);
      return methods.map(this.toResponse);
    }

    async findOne(
      id: number,
      userId: number,
      isAdmin = false,
    ): Promise<PaymentMethodResponseDto> {
      const method = isAdmin
        ? await this.repo.findById(id)
        : await this.repo.findByUserAndId(userId, id);

      if (!method) throw new NotFoundException(`Método de pago #${id} no encontrado`);
      return this.toResponse(method);
    }

    async create(
      userId: number,
      dto: CreatePaymentMethodDto,
    ): Promise<PaymentMethodResponseDto> {
      // Verificar duplicado
      const existing = await this.repo.findAllByUser(userId);
      const duplicate = existing.find(
        (m) =>
          m.accountNumber === dto.accountNumber &&
          m.provider      === dto.provider,
      );
      if (duplicate) {
        throw new ConflictException('Este método de pago ya está registrado');
      }

      // Si es default, limpiar los anteriores
      if (dto.isDefault) {
        await this.repo.clearDefaults(userId);
      }

      // Si es el primero, se marca como default automáticamente
      const isFirst    = existing.length === 0;
      const isDefault  = dto.isDefault || isFirst;

      const method = await this.repo.create({
        type:          dto.type,
        provider:      dto.provider.trim(),
        accountNumber: dto.accountNumber.trim(),
        accountHolder: dto.accountHolder.trim(),
        isDefault,
        user: { connect: { id: userId } },
      });

      return this.toResponse(method);
    }

    async update(
      id: number,
      userId: number,
      dto: UpdatePaymentMethodDto,
    ): Promise<PaymentMethodResponseDto> {
      await this.findOne(id, userId);

      if (dto.isDefault) {
        await this.repo.clearDefaults(userId);
      }

      const method = await this.repo.update(id, {
        ...(dto.accountHolder !== undefined && { accountHolder: dto.accountHolder }),
        ...(dto.isDefault     !== undefined && { isDefault:     dto.isDefault }),
        ...(dto.isActive      !== undefined && { isActive:      dto.isActive }),
      });

      return this.toResponse(method);
    }

    async remove(id: number, userId: number): Promise<void> {
      const method = await this.repo.findByUserAndId(userId, id);
      if (!method) throw new NotFoundException(`Método de pago #${id} no encontrado`);
      if (method.isDefault) {
        throw new ForbiddenException(
          'No puedes eliminar el método de pago predeterminado. Asigna otro primero',
        );
      }
      await this.repo.softDelete(id);
    }

    private toResponse(method: PaymentMethod): PaymentMethodResponseDto {
      return {
        id:            method.id,
        userId:        method.userId,
        type:          method.type,
        provider:      method.provider,
        accountNumber: method.accountNumber,
        accountHolder: method.accountHolder,
        isDefault:     method.isDefault,
        isActive:      method.isActive,
        createdAt:     method.createdAt,
        updatedAt:     method.updatedAt,
      };
    }
  }
