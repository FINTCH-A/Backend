import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus }             from '@prisma/client';

export class UserResponseDto {
  @ApiProperty() id:            number;
  @ApiProperty() firstName:     string;
  @ApiProperty() lastName:      string;
  @ApiProperty() dni:           string;
  @ApiProperty() email:         string;
  @ApiProperty() phone:         string;
  @ApiProperty() dateOfBirth:   Date;
  @ApiProperty({ enum: UserRole })   role:   UserRole;
  @ApiProperty({ enum: UserStatus }) status: UserStatus;
  @ApiProperty() emailVerified: boolean;
  @ApiProperty() phoneVerified: boolean;
  @ApiPropertyOptional() lastLogin:  Date | null;
  @ApiProperty()         createdAt:  Date;
  @ApiProperty()         updatedAt:  Date;
}
