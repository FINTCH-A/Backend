import { Injectable, Logger } from '@nestjs/common';
import { WebhookRepository }  from './webhook.repository';
import { WebhookEventResponseDto } from './dto/response/webhook-event-response.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly repo: WebhookRepository) {}

  async receive(type: string, payload: any): Promise<WebhookEventResponseDto> {
    const event = await this.repo.create(type, payload);

    this.logger.log(`Webhook recibido: type=${type} id=${event.id}`);

    // Procesar según tipo de evento
    await this.process(event.id, type, payload);

    return this.toResponse(event);
  }

  async processPending(): Promise<{ processed: number }> {
    const pending = await this.repo.findPending();
    let count = 0;

    for (const event of pending) {
      try {
        await this.process(event.id, event.type, event.payload);
        count++;
      } catch (err) {
        this.logger.error(`Error procesando webhook id=${event.id}`, err);
      }
    }

    return { processed: count };
  }

  private async process(
    id: number,
    type: string,
    payload: any,
  ): Promise<void> {
    try {
      switch (type) {
        case 'payment.completed':
          this.logger.log(`Pago externo completado: ref=${payload?.reference}`);
          break;
        case 'payment.failed':
          this.logger.warn(`Pago externo fallido: ref=${payload?.reference}`);
          break;
        case 'identity.verified':
          this.logger.log(`Identidad verificada: userId=${payload?.userId}`);
          break;
        default:
          this.logger.debug(`Evento no manejado: type=${type}`);
      }

      await this.repo.markProcessed(id);
    } catch (err) {
      this.logger.error(`Error procesando event id=${id}`, err);
    }
  }

  private toResponse(event: any): WebhookEventResponseDto {
    return {
      id:        event.id,
      type:      event.type,
      payload:   event.payload,
      processed: event.processed,
      createdAt: event.createdAt,
    };
  }
}
