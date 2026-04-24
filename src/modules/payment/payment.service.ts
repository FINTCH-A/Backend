import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
  } from '@nestjs/common';
  import {
    InstallmentStatus,
    Payment,
    PaymentStatus,
    LoanStatus,
    User,
    $Enums,
  } from '@prisma/client';

  import { PaymentRepository }          from './payment.repository';
  import { CreatePaymentDto }           from './dto/create-payment.dto';
  import { QueryPaymentDto }            from './dto/query-payment.dto';
  import { PaymentResponseDto }         from './dto/response/payment-response.dto';
  import { PaginatedPaymentResponseDto } from './dto/response/paginated-payment-response.dto';
  import { PrismaService }              from '../../database/prisma/prisma.service';

  @Injectable()
  export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    reverse: any;

    constructor(
      private readonly repo:   PaymentRepository,
      private readonly prisma: PrismaService,
    ) {}

    // ─── LISTAR ──────────────────────────────────────────────────

    async findAll(
      query: QueryPaymentDto,
      currentUser: User,
    ): Promise<PaginatedPaymentResponseDto> {
      const userId =
        currentUser.role === 'CUSTOMER' ? currentUser.id : undefined;

      const result = await this.repo.findAll(userId, query);
      return {
        data: result.data.map(this.toResponse),
        meta: result.meta,
      };
    }

    // ─── BUSCAR POR ID ────────────────────────────────────────────

    async findOne(id: number, user?: { id: number; firstName: string; lastName: string; dni: string; email: string; phone: string; password: string; dateOfBirth: Date; role: $Enums.UserRole; status: $Enums.UserStatus; failedLoginAttempts: number; lastLogin: Date | null; lockedUntil: Date | null; emailVerified: boolean; phoneVerified: boolean; createdAt: Date; updatedAt: Date; deletedAt: Date | null; }): Promise<PaymentResponseDto> {
      const payment = await this.repo.findById(id);
      if (!payment) throw new NotFoundException(`Pago #${id} no encontrado`);
      return this.toResponse(payment);
    }

    // ─── REGISTRAR PAGO ───────────────────────────────────────────

    async create(
      dto: CreatePaymentDto,
      currentUser: User,
    ): Promise<PaymentResponseDto> {
      // Verificar referencia duplicada
      const existing = await this.repo.findByReference(dto.reference);
      if (existing) {
        throw new ConflictException(`La referencia '${dto.reference}' ya fue registrada`);
      }

      // Verificar préstamo
      const loan = await this.prisma.loan.findFirst({
        where: { id: dto.loanId, deletedAt: null },
      });
      if (!loan) throw new NotFoundException('Préstamo no encontrado');
      if (loan.status !== LoanStatus.ACTIVE) {
        throw new BadRequestException('El préstamo no está activo');
      }

      // Verificar cuota si se especifica
      if (dto.installmentId) {
        const installment = await this.prisma.installment.findFirst({
          where: { id: dto.installmentId, loanId: dto.loanId },
        });
        if (!installment) {
          throw new NotFoundException('Cuota no encontrada para este préstamo');
        }
        if (installment.status === InstallmentStatus.PAID) {
          throw new BadRequestException('Esta cuota ya fue pagada completamente');
        }
      }

      // Crear pago en transacción
      const payment = await this.prisma.$transaction(async (tx) => {
        // Crear el pago
        const p = await tx.payment.create({
          data: {
            userId:          currentUser.id,
            loanId:          dto.loanId,
            installmentId:   dto.installmentId   ?? null,
            paymentMethodId: dto.paymentMethodId ?? null,
            amount:          dto.amount,
            currency:        loan.currency,
            status:          PaymentStatus.COMPLETED,
            reference:       dto.reference,
            notes:           dto.notes ?? null,
          },
        });

        // Actualizar cuota si aplica
        if (dto.installmentId) {
          const inst = await tx.installment.findUnique({
            where: { id: dto.installmentId },
          });
          if (inst) {
            const newPaid    = Number(inst.paidAmount) + dto.amount;
            const total      = Number(inst.totalAmount);
            const newStatus  =
              newPaid >= total
                ? InstallmentStatus.PAID
                : InstallmentStatus.PARTIALLY_PAID;

            await tx.installment.update({
              where: { id: dto.installmentId },
              data:  {
                paidAmount: newPaid,
                status:     newStatus,
                paidAt:     newStatus === InstallmentStatus.PAID ? new Date() : null,
              },
            });
          }
        }

        // Registrar en ledger contable
        await tx.ledgerEntry.create({
          data: {
            userId:    currentUser.id,
            loanId:    dto.loanId,
            paymentId: p.id,
            type:      'REPAYMENT',
            amount:    dto.amount,
            currency:  loan.currency,
            reference: dto.reference,
          },
        });

        // Verificar si el préstamo quedó completamente pagado
        const totalPaid = await tx.payment.aggregate({
          where: {
            loanId:    dto.loanId,
            status:    PaymentStatus.COMPLETED,
            deletedAt: null,
          },
          _sum: { amount: true },
        });

        if (Number(totalPaid._sum.amount) >= Number(loan.totalAmount)) {
          await tx.loan.update({
            where: { id: dto.loanId },
            data:  { status: LoanStatus.PAID },
          });
          await tx.loanStatusHistory.create({
            data: {
              loanId:    dto.loanId,
              status:    LoanStatus.PAID,
              changedBy: currentUser.id,
            },
          });
        }

        return p;
      });

      this.logger.log(
        `Pago registrado: id=${payment.id} monto=${dto.amount} ref=${dto.reference}`,
      );

      return this.toResponse(payment);
    }

    // ─── RESUMEN POR PRÉSTAMO ─────────────────────────────────────

    async getSummaryByLoan(loanId: number) {
      const loan = await this.prisma.loan.findFirst({
        where: { id: loanId, deletedAt: null },
      });
      if (!loan) throw new NotFoundException('Préstamo no encontrado');

      const totalPaid    = await this.repo.getTotalPaidByLoan(loanId);
      const totalAmount  = Number(loan.totalAmount);
      const pending      = Math.max(0, totalAmount - totalPaid);
      const progress     = Math.min(100, (totalPaid / totalAmount) * 100);

      return {
        loanId,
        loanCode:       loan.loanCode,
        totalAmount,
        totalPaid:      Math.round(totalPaid * 100) / 100,
        pendingAmount:  Math.round(pending * 100) / 100,
        progressPercent: Math.round(progress * 100) / 100,
        currency:       loan.currency,
      };
    }

    // ─── MAPPER ──────────────────────────────────────────────────

    private toResponse(payment: Payment): PaymentResponseDto {
      return {
        id:              payment.id,
        userId:          payment.userId,
        loanId:          payment.loanId,
        installmentId:   payment.installmentId,
        paymentMethodId: payment.paymentMethodId,
        amount:          Number(payment.amount),
        currency:        payment.currency,
        status:          payment.status,
        paymentDate:     payment.paymentDate,
        reference:       payment.reference,
        notes:           payment.notes,
        createdAt:       payment.createdAt,
        updatedAt:       payment.updatedAt,
      };
    }
  }
