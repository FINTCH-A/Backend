import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EmploymentStatus } from '@prisma/client';

export class CreateFinancialInfoDto {
  @ApiProperty({ example: 2500.00, description: 'Ingreso mensual en soles' })
  @IsNumber({}, { message: 'El ingreso mensual debe ser un número' })
  @IsPositive({ message: 'El ingreso mensual debe ser positivo' })
  @Type(() => Number)
  monthlyIncome: number;

  @ApiProperty({ example: 1200.00, description: 'Gastos mensuales en soles' })
  @IsNumber({}, { message: 'Los gastos mensuales deben ser un número' })
  @Min(0)
  @Type(() => Number)
  monthlyExpenses: number;

  @ApiProperty({ enum: EmploymentStatus, example: EmploymentStatus.EMPLOYED })
  @IsEnum(EmploymentStatus, { message: 'Estado de empleo inválido' })
  employmentStatus: EmploymentStatus;

  @ApiPropertyOptional({ example: 'Empresa SAC' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  employerName?: string;

  @ApiPropertyOptional({ example: '+51999888777' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  employerPhone?: string;

  @ApiProperty({ example: 2, description: 'Número de dependientes' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  numberOfDependents: number;

  @ApiPropertyOptional({ example: 500.00, description: 'Otros ingresos en soles' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  otherIncomeSources?: number;
}
