import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationStatus } from '@prisma/client';

export class ReviewLoanApplicationDto {
  @ApiProperty({
    enum: [
      ApplicationStatus.APPROVED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.UNDER_REVIEW,
    ],
    example: ApplicationStatus.APPROVED,
  })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiPropertyOptional({ example: 'Perfil aprobado. Historial limpio.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  analystNotes?: string;

  @ApiPropertyOptional({
    example: 4500.00,
    description: 'Monto aprobado. Si no se especifica se usa el monto solicitado',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(50000)
  @Type(() => Number)
  approvedAmount?: number;

  @ApiPropertyOptional({
    example: 18,
    description: 'Tasa de interés anual en % (ej: 18 = 18%). Por defecto 18%',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  interestRate?: number;
}
