import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodType } from '@prisma/client';

export class PaymentMethodResponseDto {
  @ApiProperty() id:            number;
  @ApiProperty() userId:        number;
  @ApiProperty({ enum: PaymentMethodType }) type: PaymentMethodType;
  @ApiProperty() provider:      string;
  @ApiProperty() accountNumber: string;
  @ApiProperty() accountHolder: string;
  @ApiProperty() isDefault:     boolean;
  @ApiProperty() isActive:      boolean;
  @ApiProperty() createdAt:     Date;
  @ApiProperty() updatedAt:     Date;
}
