import { Injectable } from '@nestjs/common';
import { Notification, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  getPaginationParams,
  paginate,
  PaginatedResult,
} from '../../common/utils/pagination.util';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(
    userId: number,
    userRole: string,
    page = 1,
    limit = 20,
    onlyUnread = false,
  ): Promise<PaginatedResult<Notification>> {
    const { take, skip } = getPaginationParams(page, limit);

    // ============================================================
    // ADMIN/ANALYST: Combinar notificaciones del sistema + personales
    // ============================================================
    if (userRole === 'ADMIN' || userRole === 'ANALYST') {
      // Construir condición where para notificaciones del sistema
      const systemWhere: any = {
        userId: null,
      };
      if (onlyUnread) {
        systemWhere.isRead = false;
      }

      // Construir condición where para notificaciones personales
      const personalWhere: any = {
        userId: userId,
      };
      if (onlyUnread) {
        personalWhere.isRead = false;
      }

      // Obtener ambas listas
      const [systemNotifications, personalNotifications] = await Promise.all([
        this.prisma.notification.findMany({
          where: systemWhere,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.notification.findMany({
          where: personalWhere,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Combinar y ordenar por fecha (más reciente primero)
      const allNotifications = [...systemNotifications, ...personalNotifications];
      const sortedNotifications = allNotifications.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Aplicar paginación
      const data = sortedNotifications.slice(skip, skip + take);
      const total = sortedNotifications.length;

      return {
        data,
        meta: paginate(total, page, limit),
      };
    }

    // ============================================================
    // CUSTOMER: Solo sus propias notificaciones
    // ============================================================
    const where: any = {
      userId: userId,
    };
    if (onlyUnread) {
      where.isRead = false;
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, meta: paginate(total, page, limit) };
  }

  async countUnread(userId: number, userRole: string): Promise<number> {
    // ============================================================
    // ADMIN/ANALYST: Contar no leídas del sistema + personales
    // ============================================================
    if (userRole === 'ADMIN' || userRole === 'ANALYST') {
      const [systemUnread, personalUnread] = await Promise.all([
        this.prisma.notification.count({
          where: {
            userId: null,
            isRead: false,
          },
        }),
        this.prisma.notification.count({
          where: {
            userId: userId,
            isRead: false,
          },
        }),
      ]);
      return systemUnread + personalUnread;
    }

    // ============================================================
    // CUSTOMER: Solo sus no leídas
    // ============================================================
    return this.prisma.notification.count({
      where: {
        userId: userId,
        isRead: false,
      },
    });
  }

  async create(data: Prisma.NotificationCreateInput): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }

  async createSystemNotification(data: {
    type: NotificationType;
    title: string;
    message: string;
    metadata?: any;
  }): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata ?? null,
        userId: null,
      },
    });
  }

  async markAsRead(id: number, userId: number, userRole: string): Promise<Notification | null> {
    // ============================================================
    // Verificar que la notificación existe y pertenece al usuario
    // ============================================================
    let notification: Notification | null = null;

    if (userRole === 'ADMIN' || userRole === 'ANALYST') {
      // Buscar en notificaciones del sistema o personales
      notification = await this.prisma.notification.findFirst({
        where: {
          id,
          OR: [{ userId: null }, { userId: userId }],
        },
      });
    } else {
      notification = await this.prisma.notification.findFirst({
        where: { id, userId },
      });
    }

    if (!notification) return null;

    // Marcar como leída
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: number, userRole: string): Promise<void> {
    if (userRole === 'ADMIN' || userRole === 'ANALYST') {
      // Marcar notificaciones del sistema como leídas
      await this.prisma.notification.updateMany({
        where: {
          userId: null,
          isRead: false,
        },
        data: { isRead: true, readAt: new Date() },
      });

      // Marcar notificaciones personales como leídas
      await this.prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false,
        },
        data: { isRead: true, readAt: new Date() },
      });
    } else {
      await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    }
  }

  async deleteOld(daysOld = 90): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        isRead: true,
      },
    });
    return result.count;
  }
}
