import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Notification, NotificationType } from '@prisma/client';

import { NotificationRepository }  from './notification.repository';
import { CreateNotificationDto }   from './dto/create-notification.dto';
import { NotificationResponseDto } from './dto/response/notification-response.dto';
import {
  NotificationPayload,
  NOTIFICATION_TEMPLATES,
} from './types/notification.types';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly repo: NotificationRepository) {}

  async findByUser(
    userId: number,
    userRole: string,
    page: number,
    limit: number,
    onlyUnread: boolean,
  ) {
    this.logger.log(`📋 Buscando notificaciones para userId=${userId}, role=${userRole}`);

    const result = await this.repo.findByUser(userId, userRole, page, limit, onlyUnread);
    const unread = await this.repo.countUnread(userId, userRole);

    this.logger.log(`✅ Encontradas ${result.data.length} notificaciones, ${unread} no leídas`);

    return {
      data: result.data.map(this.toResponse),
      meta: { ...result.meta, unread },
    };
  }

  async create(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    const notification = await this.repo.create({
      type: dto.type,
      title: dto.title,
      message: dto.message,
      metadata: dto.metadata ?? null,
      user: { connect: { id: dto.userId } },
    });

    this.logger.log(`📨 Notificación creada para usuario ${dto.userId}`);
    return this.toResponse(notification);
  }

  async createSystemNotification(data: {
    type: NotificationType;
    title: string;
    message: string;
    metadata?: any;
  }): Promise<NotificationResponseDto> {
    const notification = await this.repo.createSystemNotification(data);
    this.logger.log(`📢 Notificación del sistema creada: ${data.title}`);
    return this.toResponse(notification);
  }

  async send(payload: NotificationPayload): Promise<NotificationResponseDto> {
    const template = NOTIFICATION_TEMPLATES[payload.type];

    const notification = await this.repo.create({
      type: payload.type,
      title: payload.title || template.title,
      message: payload.message || template.message(payload.metadata),
      metadata: payload.metadata ?? null,
      user: { connect: { id: payload.userId } },
    });

    this.logger.log(
      `Notificación enviada: userId=${payload.userId} type=${payload.type}`,
    );

    return this.toResponse(notification);
  }

  async markAsRead(id: number, userId: number, userRole: string): Promise<NotificationResponseDto> {
    const notification = await this.repo.markAsRead(id, userId, userRole);
    if (!notification) throw new NotFoundException(`Notificación #${id} no encontrada`);
    return this.toResponse(notification);
  }

  async markAllAsRead(userId: number, userRole: string): Promise<{ updated: boolean }> {
    await this.repo.markAllAsRead(userId, userRole);
    return { updated: true };
  }

  async cleanOld(daysOld = 90): Promise<{ deleted: number }> {
    const deleted = await this.repo.deleteOld(daysOld);
    this.logger.log(`Notificaciones antiguas eliminadas: ${deleted}`);
    return { deleted };
  }

  private toResponse(n: Notification): NotificationResponseDto {
    return {
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      readAt: n.readAt,
      metadata: n.metadata,
      createdAt: n.createdAt,
    };
  }
}
