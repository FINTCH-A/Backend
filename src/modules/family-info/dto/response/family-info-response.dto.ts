import { ApiProperty }                from '@nestjs/swagger';
import { HousingType, MaritalStatus } from '@prisma/client';

export class FamilyInfoResponseDto {
  @ApiProperty() id:               number;
  @ApiProperty() userId:           number;
  @ApiProperty({ enum: MaritalStatus }) maritalStatus:    MaritalStatus;
  @ApiProperty() numberOfChildren: number;
  @ApiProperty({ enum: HousingType })   housingType:      HousingType;
  @ApiProperty() createdAt:        Date;
  @ApiProperty() updatedAt:        Date;
}
