import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentMethodType } from '@prisma/client';

export class CreatePaymentMethodDto {
  @ApiProperty({ enum: PaymentMethodType, example: PaymentMethodType.DIGITAL_WALLET })
  @IsEnum(PaymentMethodType, { message: 'Tipo de método de pago inválido' })
  type: PaymentMethodType;

  @ApiProperty({ example: 'Yape', description: 'Proveedor: Yape, Plin, BCP, etc.' })
  @IsString()
  @IsNotEmpty({ message: 'El proveedor es requerido' })
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  provider: string;

  @ApiProperty({ example: '987654321', description: 'Número de cuenta o teléfono' })
  @IsString()
  @IsNotEmpty({ message: 'El número de cuenta es requerido' })
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  accountNumber: string;

  @ApiProperty({ example: 'Juan Pérez García' })
  @IsString()
  @IsNotEmpty({ message: 'El titular es requerido' })
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  accountHolder: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
