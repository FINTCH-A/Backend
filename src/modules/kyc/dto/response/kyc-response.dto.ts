import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class KycResponseDto {
  @ApiProperty()         id:            number;
  @ApiProperty()         userId:        number;
  @ApiPropertyOptional() documentFront: string | null;
  @ApiPropertyOptional() documentBack:  string | null;
  @ApiPropertyOptional() selfie:        string | null;
  @ApiProperty()         verified:      boolean;
  @ApiPropertyOptional() verifiedAt:    Date | null;
}
