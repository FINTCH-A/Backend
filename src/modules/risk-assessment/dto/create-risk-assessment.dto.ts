import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRiskAssessmentDto {
  @ApiProperty({ example: 25.5, description: 'Score de riesgo (0-100). Menor = menos riesgo' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  score: number;

  @ApiProperty({ example: 'BAJO', description: 'BAJO | MEDIO | ALTO | CRITICO' })
  @IsString()
  @MaxLength(20)
  riskLevel: string;

  @ApiPropertyOptional({
    example: { duplicateDni: false, suspiciousIp: false, velocityCheck: true },
    description: 'Razones del score de riesgo',
  })
  @IsOptional()
  reasons?: Record<string, any>;

  @ApiPropertyOptional({ example: '190.168.1.1' })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 Chrome/120' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deviceInfo?: string;
}
