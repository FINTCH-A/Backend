import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class TransactionEntity {
  @ApiProperty() id:         number;
  @ApiProperty() paymentId:  number;
  @ApiProperty() provider:   string;
  @ApiProperty() externalId: string;
  @ApiProperty({ enum: PaymentStatus }) status: PaymentStatus;
  @ApiPropertyOptional() response: any;
  @ApiProperty() createdAt:  Date;
}
