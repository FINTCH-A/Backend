import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RiskAssessmentEntity {
  @ApiProperty() id:         number;
  @ApiProperty() userId:     number;
  @ApiProperty() score:      number;
  @ApiProperty() riskLevel:  string;
  @ApiPropertyOptional() reasons:    any;
  @ApiPropertyOptional() ipAddress:  string | null;
  @ApiPropertyOptional() deviceInfo: string | null;
  @ApiProperty()         createdAt:  Date;
}
