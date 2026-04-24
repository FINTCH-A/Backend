import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsPositive,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AmortizationType, InterestType } from '@prisma/client';

export class CreateLoanDto {
  @ApiProperty({ example: 1, description: 'ID de la solicitud aprobada' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  loanApplicationId: number;

  @ApiProperty({ example: 4500.00 })
  @IsNumber()
  @IsPositive()
  @Max(50000)
  @Type(() => Number)
  approvedAmount: number;

  @ApiProperty({ example: 0.18, description: 'Tasa de interés anual (ej: 0.18 = 18%)' })
  @IsNumber()
  @Min(0.01)
  @Max(1)
  @Type(() => Number)
  interestRate: number;

  @ApiPropertyOptional({ enum: InterestType, default: InterestType.FIXED })
  @IsOptional()
  @IsEnum(InterestType)
  interestType?: InterestType;

  @ApiPropertyOptional({ enum: AmortizationType, default: AmortizationType.FRENCH })
  @IsOptional()
  @IsEnum(AmortizationType)
  amortization?: AmortizationType;
}
