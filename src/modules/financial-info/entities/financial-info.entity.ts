import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentStatus } from '@prisma/client';

export class FinancialInfoEntity {
  @ApiProperty() id:                 number;
  @ApiProperty() userId:             number;
  @ApiProperty() monthlyIncome:      number;
  @ApiProperty() monthlyExpenses:    number;
  @ApiProperty({ enum: EmploymentStatus }) employmentStatus: EmploymentStatus;
  @ApiPropertyOptional() employerName:       string | null;
  @ApiPropertyOptional() employerPhone:      string | null;
  @ApiProperty()         numberOfDependents: number;
  @ApiPropertyOptional() otherIncomeSources: number | null;
  @ApiProperty()         createdAt:          Date;
  @ApiProperty()         updatedAt:          Date;
}
