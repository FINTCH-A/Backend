import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RiskAssessmentResponseDto {
  @ApiProperty() id:            number;
  @ApiProperty() userId:        number;
  @ApiProperty() score:         number;
  @ApiProperty() riskLevel:     string;
  @ApiProperty() riskLabel:     string;
  @ApiProperty() approved:      boolean;
  @ApiPropertyOptional() reasons:    any;
  @ApiPropertyOptional() ipAddress:  string | null;
  @ApiPropertyOptional() deviceInfo: string | null;
  @ApiProperty()         createdAt:  Date;
}
