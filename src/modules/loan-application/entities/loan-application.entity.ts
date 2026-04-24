import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';

export class LoanApplicationEntity {
  @ApiProperty() id:              number;
  @ApiProperty() userId:          number;
  @ApiProperty() requestedAmount: number;
  @ApiProperty() requestedTerm:   number;
  @ApiPropertyOptional() purpose:       string | null;
  @ApiProperty({ enum: ApplicationStatus }) status: ApplicationStatus;
  @ApiPropertyOptional() analystNotes:  string | null;
  @ApiPropertyOptional() reviewedAt:    Date | null;
  @ApiPropertyOptional() reviewedBy:    number | null;
  @ApiProperty()         createdAt:     Date;
  @ApiProperty()         updatedAt:     Date;
}
