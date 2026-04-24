import { UserRole, UserStatus } from '@prisma/client';
import { ApiProperty }          from '@nestjs/swagger';

export class UserEntity {
  @ApiProperty() id:                  number;
  @ApiProperty() firstName:           string;
  @ApiProperty() lastName:            string;
  @ApiProperty() dni:                 string;
  @ApiProperty() email:               string;
  @ApiProperty() phone:               string;
  @ApiProperty() dateOfBirth:         Date;
  @ApiProperty({ enum: UserRole })   role:   UserRole;
  @ApiProperty({ enum: UserStatus }) status: UserStatus;
  @ApiProperty() emailVerified:       boolean;
  @ApiProperty() phoneVerified:       boolean;
  @ApiProperty() failedLoginAttempts: number;
  @ApiProperty() lastLogin:           Date | null;
  @ApiProperty() lockedUntil:         Date | null;
  @ApiProperty() createdAt:           Date;
  @ApiProperty() updatedAt:           Date;
  @ApiProperty() deletedAt:           Date | null;
}
