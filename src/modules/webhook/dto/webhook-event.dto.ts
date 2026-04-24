import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class WebhookEventDto {
  @ApiProperty({ example: 'payment.completed', description: 'Tipo de evento' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Payload del evento externo' })
  @IsObject()
  payload: Record<string, any>;
}
