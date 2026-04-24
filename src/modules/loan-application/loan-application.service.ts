import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  LoanApplication,
  User,
  LoanStatus,
  InterestType,
  AmortizationType,
  InstallmentStatus,
  NotificationType,
  LedgerType,
} from '@prisma/client';

import { LoanApplicationRepository } from './loan-application.repository';
import { CreateLoanApplicationDto }  from './dto/create-loan-application.dto';
import { UpdateLoanApplicationDto }  from './dto/update-loan-application.dto';
import { ReviewLoanApplicationDto }  from './dto/review-loan-application.dto';
import { LoanApplicationResponseDto } from './dto/response/loan-application-response.dto';
import { PaginatedLoanApplicationResponseDto } from './dto/response/paginated-loan-application-response.dto';
import { PrismaService }             from '../../database/prisma/prisma.service';
import { addMonths }                 from '../../common/utils/date.util';
import { NotificationService }       from '../notification/notification.service'; // ← AGREGAR

const MAX_ACTIVE_APPLICATIONS = 3;

export interface ApplicationQuery {
  page?:   number;
  limit?:  number;
  userId?: number;
  status?: ApplicationStatus;
}

@Injectable()
export class LoanApplicationService {
  private readonly logger = new Logger(LoanApplicationService.name);

  constructor(
    private readonly repo:   LoanApplicationRepository,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService, // ← INYECTAR
  ) {}

  // ─── LISTAR ──────────────────────────────────────────────────

  async findAll(
    query: ApplicationQuery,
    currentUser: User,
  ): Promise<PaginatedLoanApplicationResponseDto> {
    const userId =
      currentUser.role === 'CUSTOMER' ? currentUser.id : query.userId;

    const result = await this.repo.findAll({ ...query, userId });
    return {
      data: result.data.map(this.toResponse),
      meta: result.meta,
    };
  }

  // ─── BUSCAR POR ID ────────────────────────────────────────────

  async findOne(
    id: number,
    currentUser: User,
  ): Promise<LoanApplicationResponseDto> {
    const app = await this.getOrFail(id, currentUser);
    return this.toResponse(app);
  }

  // ─── CREAR ────────────────────────────────────────────────────

  async create(
    dto: CreateLoanApplicationDto,
    currentUser: User,
    ip?: string,
  ): Promise<LoanApplicationResponseDto> {
    const active = await this.repo.countActiveByUser(currentUser.id);
    if (active >= MAX_ACTIVE_APPLICATIONS) {
      throw new BadRequestException(
        'Ya tienes solicitudes activas pendientes de resolución',
      );
    }

    const app = await this.repo.create({
      requestedAmount: dto.requestedAmount,
      requestedTerm:   dto.requestedTerm,
      purpose:         dto.purpose ?? null,
      status:          ApplicationStatus.DRAFT,
      user:            { connect: { id: currentUser.id } },
      requestLocation: ip
        ? { create: { ipAddress: ip } }
        : undefined,
    });

    this.logger.log(
      `Solicitud creada: id=${app.id} userId=${currentUser.id} monto=${dto.requestedAmount}`,
    );

    return this.toResponse(app);
  }

  // ─── ACTUALIZAR ───────────────────────────────────────────────

  async update(
    id: number,
    dto: UpdateLoanApplicationDto,
    currentUser: User,
  ): Promise<LoanApplicationResponseDto> {
    const app = await this.getOrFail(id, currentUser);

    if (app.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException(
        'Solo puedes editar solicitudes en estado BORRADOR',
      );
    }

    const updated = await this.repo.update(id, {
      ...(dto.requestedAmount && { requestedAmount: dto.requestedAmount }),
      ...(dto.requestedTerm   && { requestedTerm:   dto.requestedTerm }),
      ...(dto.purpose         && { purpose:         dto.purpose }),
    });

    return this.toResponse(updated);
  }

  // ─── ENVIAR ───────────────────────────────────────────────────
  // ✅ AGREGAR NOTIFICACIÓN: Cuando el cliente envía la solicitud
  async submit(
    id: number,
    currentUser: User,
  ): Promise<LoanApplicationResponseDto> {
    const app = await this.getOrFail(id, currentUser);

    if (app.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException(
        'Solo puedes enviar solicitudes en estado BORRADOR',
      );
    }

    const updated = await this.repo.update(id, {
      status: ApplicationStatus.SUBMITTED,
    });

    this.logger.log(`Solicitud enviada: id=${id} userId=${currentUser.id}`);

    // ============================================================
    // ✅ NOTIFICACIÓN: Enviar a ADMIN y ANALYST que hay nueva solicitud
    // ============================================================
    try {
      // Contar solicitudes pendientes
      const pendingCount = await this.repo.countByStatus(ApplicationStatus.SUBMITTED);

      // Obtener todos los administradores y analistas
      const adminsAndAnalysts = await this.prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'ANALYST'] },
          deletedAt: null
        },
        select: { id: true },
      });

      this.logger.log(`📢 Enviando notificación a ${adminsAndAnalysts.length} administradores/analistas`);

      for (const user of adminsAndAnalysts) {
        await this.notificationService.create({
          userId: user.id,
          type: NotificationType.SYSTEM_ALERT,
          title: '📋 Nueva solicitud de préstamo',
          message: `${currentUser.firstName} ${currentUser.lastName} ha enviado una nueva solicitud de préstamo por S/ ${Number(app.requestedAmount).toLocaleString('es-PE')}`,
          metadata: {
            applicationId: app.id,
            userId: currentUser.id,
            userName: `${currentUser.firstName} ${currentUser.lastName}`,
            amount: Number(app.requestedAmount),
            term: app.requestedTerm,
            pendingCount,
          },
        });
      }
      this.logger.log(`✅ Notificaciones enviadas a administradores/analistas`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Error enviando notificaciones: ${errorMessage}`);
    }

    return this.toResponse(updated);
  }

  // ─── REVISAR Y CREAR PRÉSTAMO AUTOMÁTICAMENTE ─────────────────
  // ✅ AGREGAR NOTIFICACIONES: Cuando se aprueba o rechaza
  async review(
    id: number,
    dto: ReviewLoanApplicationDto,
    analystId: number,
  ): Promise<LoanApplicationResponseDto> {
    const app = await this.repo.findById(id);
    if (!app) throw new NotFoundException(`Solicitud #${id} no encontrada`);

    const validStatuses: ApplicationStatus[] = [
      ApplicationStatus.SUBMITTED,
      ApplicationStatus.UNDER_REVIEW,
    ];

    if (!validStatuses.includes(app.status as ApplicationStatus)) {
      throw new BadRequestException(
        'Solo puedes revisar solicitudes ENVIADAS o EN REVISIÓN',
      );
    }

    // Obtener información del analista para la notificación
    const analyst = await this.prisma.user.findUnique({
      where: { id: analystId },
      select: { firstName: true, lastName: true },
    });

    // Actualizar solicitud
    const updated = await this.repo.update(id, {
      status:       dto.status,
      analystNotes: dto.analystNotes ?? null,
      reviewedAt:   new Date(),
      reviewedBy:   analystId,
    });

    this.logger.log(
      `Solicitud revisada: id=${id} status=${dto.status} analista=${analystId}`,
    );

    // ──────────────────────────────────────────────────────────
    // ✅ NOTIFICACIÓN: Si se APRUEBA
    // ──────────────────────────────────────────────────────────
    if (dto.status === ApplicationStatus.APPROVED) {
      this.logger.log(`✅ Solicitud #${id} APROBADA. Creando préstamo y notificando al cliente...`);

      await this.createLoanFromApplication(app, dto, analystId);

      // Notificar al cliente que su solicitud fue aprobada
      try {
        await this.notificationService.create({
          userId: app.userId,
          type: NotificationType.LOAN_APPROVED,
          title: '✅ ¡Solicitud Aprobada!',
          message: `¡Felicidades! Tu solicitud de préstamo por S/ ${Number(app.requestedAmount).toLocaleString('es-PE')} ha sido APROBADA por el analista ${analyst?.firstName} ${analyst?.lastName}. En breve se generará tu préstamo.`,
          metadata: {
            applicationId: app.id,
            amount: Number(app.requestedAmount),
            approvedBy: analystId,
            analystName: `${analyst?.firstName} ${analyst?.lastName}`,
          },
        });
        this.logger.log(`✅ Notificación de aprobación enviada al cliente ${app.userId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`❌ Error enviando notificación de aprobación: ${errorMessage}`);
      }
    }

    // ──────────────────────────────────────────────────────────
    // ✅ NOTIFICACIÓN: Si se RECHAZA
    // ──────────────────────────────────────────────────────────
    if (dto.status === ApplicationStatus.REJECTED) {
      this.logger.log(`❌ Solicitud #${id} RECHAZADA. Notificando al cliente...`);

      try {
        await this.notificationService.create({
          userId: app.userId,
          type: NotificationType.LOAN_REJECTED,
          title: '❌ Solicitud Rechazada',
          message: `Lo sentimos, tu solicitud de préstamo por S/ ${Number(app.requestedAmount).toLocaleString('es-PE')} ha sido RECHAZADA. Motivo: ${dto.analystNotes || 'No cumple con los requisitos de la evaluación.'}`,
          metadata: {
            applicationId: app.id,
            amount: Number(app.requestedAmount),
            reason: dto.analystNotes,
            reviewedBy: analystId,
            analystName: `${analyst?.firstName} ${analyst?.lastName}`,
          },
        });
        this.logger.log(`✅ Notificación de rechazo enviada al cliente ${app.userId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`❌ Error enviando notificación de rechazo: ${errorMessage}`);
      }
    }

    return this.toResponse(updated);
  }

  // ─── CANCELAR ─────────────────────────────────────────────────

  async cancel(
    id: number,
    currentUser: User,
  ): Promise<LoanApplicationResponseDto> {
    const app = await this.getOrFail(id, currentUser);

    const nonCancellableStatuses: ApplicationStatus[] = [
      ApplicationStatus.APPROVED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.CANCELLED,
    ];

    if (nonCancellableStatuses.includes(app.status as ApplicationStatus)) {
      throw new BadRequestException(
        'No se puede cancelar en el estado actual',
      );
    }

    const updated = await this.repo.update(id, {
      status: ApplicationStatus.CANCELLED,
    });

    this.logger.log(`Solicitud cancelada: id=${id} userId=${currentUser.id}`);

    return this.toResponse(updated);
  }

  // ─── CREAR PRÉSTAMO + CUOTAS AUTOMÁTICAMENTE ──────────────────
  // (NO MODIFICADO - ya funciona correctamente)

  private async createLoanFromApplication(
    app: LoanApplication,
    dto: ReviewLoanApplicationDto,
    analystId: number,
  ): Promise<void> {
    try {
      // Verificar que no tenga préstamo ya creado
      const existing = await this.prisma.loan.findUnique({
        where: { loanApplicationId: app.id },
      });

      if (existing) {
        this.logger.warn(
          `Solicitud #${app.id} ya tiene préstamo creado: ${existing.loanCode}`,
        );
        return;
      }

      // Datos del préstamo
      const approvedAmount = dto.approvedAmount
        ? Number(dto.approvedAmount)
        : Number(app.requestedAmount);

      // interestRate: si viene como porcentaje (ej: 18) se divide por 100
      let interestRate = dto.interestRate ?? 18;
      if (interestRate > 1) {
        interestRate = interestRate / 100;
      }

      const termMonths = app.requestedTerm;

      // Calcular total con amortización francesa
      const monthly = interestRate / 12;
      const factor = Math.pow(1 + monthly, termMonths);
      const fee = (approvedAmount * (monthly * factor)) / (factor - 1);
      const total = Math.round(fee * termMonths * 100) / 100;

      // ============================================================
      // Generar loanCode ÚNICO de forma segura
      // ============================================================
      let loanCode: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');

        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const seq = `${timestamp}${random}`.slice(-6);

        loanCode = `AV${year}${month}-${seq}`;

        const existingLoan = await this.prisma.loan.findUnique({
          where: { loanCode },
        });

        isUnique = !existingLoan;
        attempts++;

        if (!isUnique) {
          this.logger.warn(`⚠️ LoanCode duplicado: ${loanCode}, reintentando...`);
        }

      } while (!isUnique && attempts < maxAttempts);

      if (!isUnique) {
        throw new Error('No se pudo generar un código de préstamo único después de varios intentos');
      }

      this.logger.log(`📝 LoanCode generado: ${loanCode}`);

      const disbursedAt = new Date();
      const dueDate = addMonths(disbursedAt, termMonths);

      // Crear todo en una transacción
      await this.prisma.$transaction(async (tx) => {
        // 1. Crear préstamo
        const loan = await tx.loan.create({
          data: {
            userId: app.userId,
            loanApplicationId: app.id,
            loanCode,
            requestedAmount: app.requestedAmount,
            approvedAmount,
            interestRate,
            interestType: InterestType.FIXED,
            amortization: AmortizationType.FRENCH,
            totalAmount: total,
            termMonths,
            currency: 'PEN',
            status: LoanStatus.ACTIVE,
            approvedBy: analystId,
            disbursedAt,
            dueDate,
          },
        });

        this.logger.log(`✅ Préstamo creado: ID=${loan.id}, Código=${loanCode}`);

        // 2. Generar cuotas
        let balance = approvedAmount;
        const installments = [];

        for (let i = 1; i <= termMonths; i++) {
          const interest = Math.round(balance * monthly * 100) / 100;
          const principal = Math.round((fee - interest) * 100) / 100;
          const dueDateInstallment = addMonths(disbursedAt, i);

          installments.push({
            loanId: loan.id,
            installmentNumber: i,
            principalAmount: principal,
            interestAmount: interest,
            totalAmount: Math.round(fee * 100) / 100,
            paidAmount: 0,
            currency: 'PEN',
            dueDate: dueDateInstallment,
            status: InstallmentStatus.PENDING,
            daysOverdue: 0,
          });

          balance -= principal;
        }

        await tx.installment.createMany({ data: installments });
        this.logger.log(`✅ ${installments.length} cuotas generadas para préstamo ${loanCode}`);

        // 3. Entrada en el ledger
        await tx.ledgerEntry.create({
          data: {
            userId: app.userId,
            loanId: loan.id,
            type: LedgerType.DISBURSEMENT,
            amount: approvedAmount,
            currency: 'PEN',
            reference: loanCode,
          },
        });

        // 4. Notificación al cliente (ya se envía en el método review, esta es adicional)
        await tx.notification.create({
          data: {
            userId: app.userId,
            type: NotificationType.LOAN_APPROVED,
            title: '✅ Préstamo Aprobado',
            message: `Tu préstamo por S/ ${approvedAmount.toLocaleString('es-PE')} fue aprobado. Código: ${loanCode}. Se generaron ${termMonths} cuotas.`,
            metadata: {
              loanCode,
              approvedAmount,
              termMonths,
              monthlyFee: Math.round(fee * 100) / 100,
            },
          },
        });

        this.logger.log(
          `✅ Todo completado: Préstamo ${loanCode} | userId=${app.userId} | monto=${approvedAmount} | cuotas=${termMonths}`,
        );
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `❌ Error creando préstamo para solicitud #${app.id}: ${errorMessage}`,
        error,
      );
    }
  }

  // ─── HELPERS ─────────────────────────────────────────────────

  private async getOrFail(
    id: number,
    user: User,
  ): Promise<LoanApplication> {
    const app =
      user.role === 'CUSTOMER'
        ? await this.repo.findByUserAndId(user.id, id)
        : await this.repo.findById(id);

    if (!app) throw new NotFoundException(`Solicitud #${id} no encontrada`);
    return app;
  }

  private toResponse(app: LoanApplication): LoanApplicationResponseDto {
    return {
      id:              app.id,
      userId:          app.userId,
      requestedAmount: Number(app.requestedAmount),
      requestedTerm:   app.requestedTerm,
      purpose:         app.purpose,
      status:          app.status,
      analystNotes:    app.analystNotes,
      reviewedAt:      app.reviewedAt,
      reviewedBy:      app.reviewedBy,
      createdAt:       app.createdAt,
      updatedAt:       app.updatedAt,
    };
  }
}
