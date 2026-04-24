import { NotificationType } from '@prisma/client';

export interface NotificationPayload {
  userId:   number;
  type:     NotificationType;
  title:    string;
  message:  string;
  metadata?: Record<string, any>;
}

export const NOTIFICATION_TEMPLATES: Record<
  NotificationType,
  { title: string; message: (data?: any) => string }
> = {
  LOAN_APPROVED: {
    title:   '✅ Préstamo Aprobado',
    message: (d) =>
      `Tu préstamo por S/ ${d?.amount ?? ''} ha sido aprobado. Código: ${d?.loanCode ?? ''}`,
  },
  LOAN_REJECTED: {
    title:   '❌ Solicitud Rechazada',
    message: (d) =>
      `Tu solicitud de préstamo ha sido rechazada. ${d?.reason ?? 'Contacta a soporte para más información.'}`,
  },
  PAYMENT_DUE: {
    title:   '⏰ Cuota por Vencer',
    message: (d) =>
      `Tu cuota #${d?.installmentNumber ?? ''} de S/ ${d?.amount ?? ''} vence el ${d?.dueDate ?? ''}`,
  },
  PAYMENT_RECEIVED: {
    title:   '💚 Pago Recibido',
    message: (d) =>
      `Recibimos tu pago de S/ ${d?.amount ?? ''}. Referencia: ${d?.reference ?? ''}`,
  },
  PAYMENT_OVERDUE: {
    title:   '🔴 Cuota Vencida',
    message: (d) =>
      `Tienes una cuota vencida de S/ ${d?.amount ?? ''}. Regulariza tu situación cuanto antes.`,
  },
  ACCOUNT_UPDATE: {
    title:   '🔔 Actualización de Cuenta',
    message: () => 'Los datos de tu cuenta han sido actualizados.',
  },
  SYSTEM_ALERT: {
    title:   '⚠️ Alerta del Sistema',
    message: (d) => d?.message ?? 'Se ha generado una alerta en el sistema.',
  },
};

