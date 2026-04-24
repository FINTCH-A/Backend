import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCreditScoreDto {
  @ApiProperty({ example: 720, description: 'Score crediticio (300-850)' })
  @IsInt()
  @Min(300)
  @Max(850)
  @Type(() => Number)
  score: number;

  @ApiProperty({ example: 'BAJO', description: 'BAJO | MEDIO | ALTO | MUY_ALTO' })
  @IsString()
  @MaxLength(20)
  riskLevel: string;

  @ApiPropertyOptional({ example: 0.95, description: 'Historial de pagos (0-1)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  paymentHistory?: number;

  @ApiPropertyOptional({ example: 0.35, description: 'Ratio de deuda (0-1)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  debtRatio?: number;

  @ApiPropertyOptional({ example: 15000, description: 'Monto máximo de préstamo en soles' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxLoanAmount?: number;

  @ApiPropertyOptional({ example: 'Buen historial de pagos en últimos 12 meses' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
