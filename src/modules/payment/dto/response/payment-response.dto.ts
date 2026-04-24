import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class PaymentResponseDto {
  @ApiProperty() id:              number;
  @ApiProperty() userId:          number;
  @ApiProperty() loanId:          number;
  @ApiPropertyOptional() installmentId:   number | null;
  @ApiPropertyOptional() paymentMethodId: number | null;
  @ApiProperty() amount:          number;
  @ApiProperty() currency:        string;
  @ApiProperty({ enum: PaymentStatus }) status: PaymentStatus;
  @ApiProperty() paymentDate:     Date;
  @ApiProperty() reference:       string;
  @ApiPropertyOptional() notes:   string | null;
  @ApiProperty() createdAt:       Date;
  @ApiProperty() updatedAt:       Date;
}
