import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreatePaymentDto {
  @ApiProperty({ example: 1, description: 'ID del préstamo' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  loanId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID de la cuota a pagar' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  installmentId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del método de pago' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  paymentMethodId?: number;

  @ApiProperty({ example: 450.00, description: 'Monto del pago en soles' })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto debe ser positivo' })
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'YAP-20240115-001', description: 'Referencia externa del pago' })
  @IsString()
  @IsNotEmpty({ message: 'La referencia es requerida' })
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  reference: string;

  @ApiPropertyOptional({ example: 'Pago via Yape' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
