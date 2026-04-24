import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty() id:       number;
  @ApiProperty() userId:   number;
  @ApiProperty({ enum: NotificationType }) type: NotificationType;
  @ApiProperty() title:    string;
  @ApiProperty() message:  string;
  @ApiProperty() isRead:   boolean;
  @ApiPropertyOptional() readAt:   Date | null;
  @ApiPropertyOptional() metadata: any;
  @ApiProperty()         createdAt: Date;
}
