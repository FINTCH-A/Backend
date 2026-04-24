import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreditScoreResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() userId: number;
  @ApiProperty() score: number;
  @ApiProperty() riskLevel: string;
  @ApiProperty({ required: false }) riskLabel?: string;
  @ApiProperty({ required: false }) scoreLabel?: string;
  @ApiProperty() paymentHistory: number | null;
  @ApiProperty() debtRatio: number | null;
  @ApiProperty() maxLoanAmount: number | null;
  @ApiProperty() notes: string | null;
  @ApiProperty() evaluatedAt: Date;
  @ApiProperty() expiresAt: Date | null;
  @ApiProperty({ required: false }) isExpired?: boolean;
  @ApiProperty() createdAt: Date;
}
