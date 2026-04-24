import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
  } from '@nestjs/common';
  import {
    ApiOperation,
    ApiResponse,
    ApiTags,
  } from '@nestjs/swagger';

  import { WebhookService }          from './webhook.service';
  import { WebhookEventDto }         from './dto/webhook-event.dto';
  import { WebhookEventResponseDto } from './dto/response/webhook-event-response.dto';
  import { Public }                  from '../../common/decorators/public.decorator';

  @ApiTags('Webhooks')
  @Controller('webhooks')
  export class WebhookController {
    constructor(private readonly webhookService: WebhookService) {}

    @Public()
    @Post('receive')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Recibir evento webhook externo (Yape, Plin, etc.)' })
    @ApiResponse({ status: 200, type: WebhookEventResponseDto })
    receive(
      @Body() dto: WebhookEventDto,
    ): Promise<WebhookEventResponseDto> {
      return this.webhookService.receive(dto.type, dto.payload);
    }

    @Public()
    @Post('process-pending')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reprocesar webhooks pendientes' })
    processPending(): Promise<{ processed: number }> {
      return this.webhookService.processPending();
    }
  }
