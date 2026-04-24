import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { Type }          from 'class-transformer';
import { PaymentStatus } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ example: 1, description: 'ID del pago asociado' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  paymentId: number;

  @ApiProperty({ example: 'Yape', description: 'Proveedor: Yape, Plin, BCP, etc.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  provider: string;

  @ApiProperty({ example: 'YPE-2024-ABC123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  externalId: string;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.COMPLETED })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiPropertyOptional({ description: 'Respuesta del proveedor externo (JSON)' })
  @IsOptional()
  response?: Record<string, any>;
}
