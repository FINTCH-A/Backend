import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressResponseDto {
  @ApiProperty() id:            number;
  @ApiProperty() userId:        number;
  @ApiProperty() country:       string;
  @ApiProperty() department:    string;
  @ApiProperty() city:          string;
  @ApiProperty() district:      string;
  @ApiProperty() streetAddress: string;
  @ApiPropertyOptional() postalCode: string | null;
  @ApiProperty() createdAt:     Date;
  @ApiProperty() updatedAt:     Date;
}
