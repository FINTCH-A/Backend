import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateLoanApplicationDto {
  @ApiProperty({ example: 5000.00, description: 'Monto solicitado en soles' })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto debe ser positivo' })
  @Max(50000, { message: 'El monto máximo es S/ 50,000' })
  @Type(() => Number)
  requestedAmount: number;

  @ApiProperty({ example: 12, description: 'Plazo en meses (3 a 60)' })
  @IsInt({ message: 'El plazo debe ser un número entero' })
  @Min(3,  { message: 'El plazo mínimo es 3 meses' })
  @Max(60, { message: 'El plazo máximo es 60 meses' })
  @Type(() => Number)
  requestedTerm: number;

  @ApiPropertyOptional({
    example: 'Compra de laptop para trabajo remoto',
    description: 'Motivo del préstamo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  purpose?: string;
}
