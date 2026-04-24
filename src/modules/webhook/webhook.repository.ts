import { Injectable } from '@nestjs/common';
import { WebhookEvent } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class WebhookRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(type: string, payload: any): Promise<WebhookEvent> {
    return this.prisma.webhookEvent.create({
      data: { type, payload },
    });
  }

  async markProcessed(id: number): Promise<WebhookEvent> {
    return this.prisma.webhookEvent.update({
      where: { id },
      data:  { processed: true },
    });
  }

  async findPending(): Promise<WebhookEvent[]> {
    return this.prisma.webhookEvent.findMany({
      where:   { processed: false },
      orderBy: { createdAt: 'asc' },
      take:    50,
    });
  }
}
