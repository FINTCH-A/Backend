import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LedgerType } from '@prisma/client';

export class LedgerEntryEntity {
  @ApiProperty() id:        number;
  @ApiProperty() userId:    number;
  @ApiPropertyOptional() loanId:    number | null;
  @ApiPropertyOptional() paymentId: number | null;
  @ApiProperty({ enum: LedgerType }) type: LedgerType;
  @ApiProperty() amount:    number;
  @ApiProperty() currency:  string;
  @ApiPropertyOptional() reference: string | null;
  @ApiPropertyOptional() metadata:  any;
  @ApiProperty()         createdAt: Date;
}
