import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AmortizationType, InterestType, LoanStatus } from '@prisma/client';

export class LoanResponseDto {
  @ApiProperty() id:                number;
  @ApiProperty() userId:            number;
  @ApiProperty() loanApplicationId: number;
  @ApiProperty() loanCode:          string;
  @ApiProperty() requestedAmount:   number;
  @ApiProperty() approvedAmount:    number;
  @ApiProperty() interestRate:      number;
  @ApiProperty({ enum: InterestType })     interestType:  InterestType;
  @ApiProperty({ enum: AmortizationType }) amortization:  AmortizationType;
  @ApiProperty() totalAmount:       number;
  @ApiProperty() termMonths:        number;
  @ApiProperty() currency:          string;
  @ApiPropertyOptional() disbursedAt:  Date | null;
  @ApiPropertyOptional() dueDate:      Date | null;
  @ApiProperty({ enum: LoanStatus }) status: LoanStatus;
  @ApiProperty()         createdAt:    Date;
  @ApiProperty()         updatedAt:    Date;
}
