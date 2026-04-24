import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ApplicationStatus, LoanStatus } from '@prisma/client';

export interface DashboardStatsResponse {
  totalUsers: number;
  activeLoans: number;
  pendingApplications: number;
  totalDisbursed: number;
  userTrend: string;
  loanTrend: string;
  applicationTrend: string;
  disbursedTrend: string;
}

export interface RecentActivityResponse {
  id: number;
  type: 'payment' | 'application' | 'loan' | 'kyc';
  description: string;
  timeAgo: string;
  createdAt: Date;
}

export interface SystemAlertResponse {
  id: number;
  level: 'error' | 'warning' | 'info';
  message: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStatsResponse> {
    try {
      const [totalUsers, activeLoans, pendingApplications, totalDisbursed] = await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.loan.count({ where: { status: LoanStatus.ACTIVE, deletedAt: null } }),
        this.prisma.loanApplication.count({ where: { status: ApplicationStatus.SUBMITTED } }),
        this.prisma.loan.aggregate({
          where: { status: LoanStatus.ACTIVE, deletedAt: null },
          _sum: { approvedAmount: true },
        }),
      ]);

      // Convertir Decimal a number
      const totalDisbursedValue = totalDisbursed._sum.approvedAmount
        ? Number(totalDisbursed._sum.approvedAmount)
        : 0;

      // Calcular tendencias (comparación con mes anterior)
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

      const [usersLastMonth, loansLastMonth, disbursedLastMonth] = await Promise.all([
        this.prisma.user.count({
          where: { deletedAt: null, createdAt: { lt: now, gte: lastMonth } },
        }),
        this.prisma.loan.count({
          where: { status: LoanStatus.ACTIVE, deletedAt: null, createdAt: { lt: now, gte: lastMonth } },
        }),
        this.prisma.loan.aggregate({
          where: { status: LoanStatus.ACTIVE, deletedAt: null, createdAt: { lt: now, gte: lastMonth } },
          _sum: { approvedAmount: true },
        }),
      ]);

      const usersTwoMonthsAgo = await this.prisma.user.count({
        where: { deletedAt: null, createdAt: { lt: lastMonth, gte: twoMonthsAgo } },
      });

      const disbursedLastMonthValue = disbursedLastMonth._sum.approvedAmount
        ? Number(disbursedLastMonth._sum.approvedAmount)
        : 0;

      const userTrend = this.calculateTrend(usersLastMonth, usersTwoMonthsAgo);
      const loanTrend = this.calculateTrend(loansLastMonth, 0);
      const applicationTrend = this.calculateTrend(pendingApplications, 0);
      const disbursedTrend = this.calculateTrend(disbursedLastMonthValue, 0);

      return {
        totalUsers,
        activeLoans,
        pendingApplications,
        totalDisbursed: totalDisbursedValue,
        userTrend,
        loanTrend,
        applicationTrend,
        disbursedTrend,
      };
    } catch (error) {
      this.logger.error('Error getting dashboard stats:', error);
      return {
        totalUsers: 0,
        activeLoans: 0,
        pendingApplications: 0,
        totalDisbursed: 0,
        userTrend: '0%',
        loanTrend: '0%',
        applicationTrend: '0%',
        disbursedTrend: '0%',
      };
    }
  }

  async getRecentActivity(limit: number = 5): Promise<RecentActivityResponse[]> {
    try {
      const [payments, applications, loans] = await Promise.all([
        this.prisma.payment.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } },
        }),
        this.prisma.loanApplication.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } },
        }),
        this.prisma.loan.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } },
        }),
      ]);

      const activities: RecentActivityResponse[] = [];

      // Agregar pagos
      for (const p of payments) {
        activities.push({
          id: p.id,
          type: 'payment',
          description: `${p.user?.firstName} ${p.user?.lastName} realizó un pago de S/ ${Number(p.amount).toLocaleString('es-PE')}`,
          timeAgo: this.getTimeAgo(p.createdAt),
          createdAt: p.createdAt,
        });
      }

      // Agregar solicitudes
      for (const a of applications) {
        let statusText = '';
        switch (a.status) {
          case ApplicationStatus.APPROVED: statusText = 'Aprobada'; break;
          case ApplicationStatus.REJECTED: statusText = 'Rechazada'; break;
          case ApplicationStatus.SUBMITTED: statusText = 'Enviada'; break;
          case ApplicationStatus.UNDER_REVIEW: statusText = 'En revisión'; break;
          default: statusText = 'Borrador';
        }
        activities.push({
          id: a.id,
          type: 'application',
          description: `${a.user?.firstName} ${a.user?.lastName} solicitó S/ ${Number(a.requestedAmount).toLocaleString('es-PE')} - ${statusText}`,
          timeAgo: this.getTimeAgo(a.createdAt),
          createdAt: a.createdAt,
        });
      }

      // Agregar préstamos
      for (const l of loans) {
        activities.push({
          id: l.id,
          type: 'loan',
          description: `Préstamo ${l.loanCode} activado para ${l.user?.firstName} ${l.user?.lastName}`,
          timeAgo: this.getTimeAgo(l.createdAt),
          createdAt: l.createdAt,
        });
      }

      // Ordenar por fecha descendente y limitar
      return activities
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error('Error getting recent activity:', error);
      return [];
    }
  }

  async getAlerts(): Promise<SystemAlertResponse[]> {
    try {
      const [overdueInstallments, pendingApplications, pendingKyc] = await Promise.all([
        this.prisma.installment.count({
          where: {
            status: 'OVERDUE',
            dueDate: { lt: new Date() },
          },
        }),
        this.prisma.loanApplication.count({
          where: { status: ApplicationStatus.SUBMITTED },
        }),
        this.prisma.kYC.count({
          where: { verified: false },
        }),
      ]);

      const alerts: SystemAlertResponse[] = [];
      let alertId = 1;

      if (overdueInstallments > 0) {
        alerts.push({
          id: alertId++,
          level: 'error',
          message: `${overdueInstallments} cuota(s) vencida(s) sin regularizar`,
        });
      }

      if (pendingApplications > 0) {
        alerts.push({
          id: alertId++,
          level: 'warning',
          message: `${pendingApplications} solicitud(es) pendiente(s) de revisión`,
        });
      }

      if (pendingKyc > 0) {
        alerts.push({
          id: alertId++,
          level: 'info',
          message: `${pendingKyc} KYC pendiente(s) de verificación`,
        });
      }

      return alerts;
    } catch (error) {
      this.logger.error('Error getting system alerts:', error);
      return [];
    }
  }

  private calculateTrend(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${Math.round(change)}%`;
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / 60000);

    if (diffMinutes < 1) return 'ahora mismo';
    if (diffMinutes < 60) return `hace ${diffMinutes} min`;
    if (diffMinutes < 1440) return `hace ${Math.floor(diffMinutes / 60)} h`;
    if (diffMinutes < 43200) return `hace ${Math.floor(diffMinutes / 1440)} d`;
    return `hace ${Math.floor(diffMinutes / 43200)} meses`;
  }
}
