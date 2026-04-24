import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreditScoreEntity {
  @ApiProperty() id:             number;
  @ApiProperty() userId:         number;
  @ApiProperty() score:          number;
  @ApiProperty() riskLevel:      string;
  @ApiPropertyOptional() paymentHistory: number | null;
  @ApiPropertyOptional() debtRatio:      number | null;
  @ApiPropertyOptional() maxLoanAmount:  number | null;
  @ApiPropertyOptional() notes:          string | null;
  @ApiProperty()         evaluatedAt:    Date;
  @ApiPropertyOptional() expiresAt:      Date | null;
  @ApiProperty()         createdAt:      Date;
}
