import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateLoanApplicationDto {
  @ApiPropertyOptional({ example: 6000.00 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(50000)
  @Type(() => Number)
  requestedAmount?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(60)
  @Type(() => Number)
  requestedTerm?: number;

  @ApiPropertyOptional({ example: 'Capital de trabajo para negocio' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  purpose?: string;
}
