import { ApiProperty } from '@nestjs/swagger';

export class WebhookEventEntity {
  @ApiProperty() id:        number;
  @ApiProperty() type:      string;
  @ApiProperty() payload:   any;
  @ApiProperty() processed: boolean;
  @ApiProperty() createdAt: Date;
}
