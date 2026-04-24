import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';

export class MeResponseDto {
  @ApiProperty() id:            number;
  @ApiProperty() email:         string;
  @ApiProperty() firstName:     string;
  @ApiProperty() lastName:      string;
  @ApiProperty() dni:           string;
  @ApiProperty() phone:         string;
  @ApiProperty({ enum: UserRole })   role:   UserRole;
  @ApiProperty({ enum: UserStatus }) status: UserStatus;
  @ApiProperty() emailVerified: boolean;
  @ApiProperty() phoneVerified: boolean;
  @ApiProperty() lastLogin:     Date | null;
  @ApiProperty() createdAt:     Date;
}
