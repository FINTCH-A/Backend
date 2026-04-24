import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InstallmentStatus } from '@prisma/client';

export class InstallmentEntity {
  @ApiProperty() id:                number;
  @ApiProperty() loanId:            number;
  @ApiProperty() installmentNumber: number;
  @ApiProperty() principalAmount:   number;
  @ApiProperty() interestAmount:    number;
  @ApiProperty() totalAmount:       number;
  @ApiProperty() paidAmount:        number;
  @ApiProperty() pendingAmount:     number;
  @ApiProperty() currency:          string;
  @ApiProperty() dueDate:           Date;
  @ApiPropertyOptional() paidAt:    Date | null;
  @ApiProperty({ enum: InstallmentStatus }) status: InstallmentStatus;
  @ApiPropertyOptional() lateFee:   number | null;
  @ApiProperty()         daysOverdue: number;
  @ApiProperty()         createdAt:   Date;
  @ApiProperty()         updatedAt:   Date;
}
