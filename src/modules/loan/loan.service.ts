import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AmortizationType,
  ApplicationStatus,
  InterestType,
  Loan,
  LoanStatus,
  User,
} from '@prisma/client';

import { LoanRepository, LoanFilter } from './loan.repository';
import { CreateLoanDto }              from './dto/create-loan.dto';
import { LoanResponseDto }            from './dto/response/loan-response.dto';
import { PaginatedLoanResponseDto }   from './dto/response/paginated-loan-response.dto';
import { PrismaService }              from '../../database/prisma/prisma.service';
import { addMonths }                  from '../../common/utils/date.util';

@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);

  constructor(
    private readonly repo:   LoanRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ─── LISTAR ──────────────────────────────────────────────────
  // ============================================================
  // CORRECCIÓN 2: findAll con manejo correcto de userId para CUSTOMER
  // ============================================================
  async findAll(
    filter: LoanFilter,
    currentUser: User,
  ): Promise<PaginatedLoanResponseDto> {
    // LOG 1: Verificar usuario que hace la petición
    this.logger.log(`📋 findAll called by user: ${currentUser.email} (id=${currentUser.id}, role=${currentUser.role})`);
    console.log('🔍 [LoanService.findAll] CurrentUser:', {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
    });

    let userId: number | undefined;

    // CORRECCIÓN: Si es CUSTOMER, FORZAR currentUser.id, IGNORAR cualquier userId del filter
    if (currentUser.role === 'CUSTOMER') {
      userId = currentUser.id;
      this.logger.debug(`✅ Customer ${currentUser.id} listando sus propios préstamos`);
      console.log(`🔍 [LoanService.findAll] Es CUSTOMER, forzando userId = ${userId}`);
    } else {
      // ADMIN o ANALYST: pueden filtrar por userId si se proporciona
      userId = filter.userId;
      this.logger.debug(`🔍 Admin/Analyst listando préstamos ${userId ? `para userId=${userId}` : 'todos'}`);
      console.log(`🔍 [LoanService.findAll] Es ${currentUser.role}, userId del filter = ${userId}`);
    }

    // LOG 2: Verificar el filter antes de enviar al repository
    console.log('🔍 [LoanService.findAll] Filter antes de enviar a repository:', {
      originalFilter: filter,
      finalUserId: userId,
    });

    // Construir el filter final
    const finalFilter: LoanFilter = {
      ...filter,
      userId,
    };

    // LOG 3: Verificar el filter final
    console.log('🔍 [LoanService.findAll] FinalFilter enviado a repository:', JSON.stringify(finalFilter, null, 2));

    const result = await this.repo.findAll(finalFilter);

    // LOG 4: Verificar resultados
    console.log(`🔍 [LoanService.findAll] Repository retornó ${result.data.length} préstamos`);
    if (result.data.length === 0) {
      console.warn(`⚠️ [LoanService.findAll] No se encontraron préstamos para userId=${userId}`);
    } else {
      console.log(`🔍 [LoanService.findAll] IDs de préstamos encontrados: ${result.data.map(l => l.id).join(', ')}`);
    }

    return {
      data: result.data.map(this.toResponse),
      meta: result.meta,
    };
  }

  // ─── BUSCAR POR ID ────────────────────────────────────────────

  async findOne(id: number, currentUser: User): Promise<LoanResponseDto> {
    console.log(`🔍 [LoanService.findOne] Buscando préstamo id=${id} para user=${currentUser.id} (role=${currentUser.role})`);

    const loan =
      currentUser.role === 'CUSTOMER'
        ? await this.repo.findByUserAndId(currentUser.id, id)
        : await this.repo.findById(id);

    if (!loan) {
      console.warn(`⚠️ [LoanService.findOne] Préstamo #${id} no encontrado para user=${currentUser.id}`);
      throw new NotFoundException(`Préstamo #${id} no encontrado`);
    }

    console.log(`✅ [LoanService.findOne] Préstamo encontrado: ${loan.loanCode}`);
    return this.toResponse(loan);
  }

  // ─── DESEMBOLSAR (APPROVED → ACTIVE) ─────────────────────────

  async disburse(
    id: number,
    analystId: number,
  ): Promise<LoanResponseDto> {
    console.log(`🔍 [LoanService.disburse] Desembolsando préstamo id=${id} por analyst=${analystId}`);

    const loan = await this.repo.findById(id);
    if (!loan) {
      console.warn(`⚠️ [LoanService.disburse] Préstamo #${id} no encontrado`);
      throw new NotFoundException(`Préstamo #${id} no encontrado`);
    }

    if (loan.status !== LoanStatus.APPROVED) {
      console.warn(`⚠️ [LoanService.disburse] Préstamo #${id} está en estado ${loan.status}, no se puede desembolsar`);
      throw new BadRequestException(
        'Solo se pueden desembolsar préstamos en estado APROBADO',
      );
    }

    const disbursedAt = new Date();
    const dueDate     = addMonths(disbursedAt, loan.termMonths);

    const updated = await this.prisma.$transaction(async (tx) => {
      // Actualizar préstamo
      const l = await tx.loan.update({
        where: { id },
        data: {
          status:     LoanStatus.ACTIVE,
          disbursedAt,
          dueDate,
          approvedBy: analystId,
        },
      });

      // Registrar historial
      await tx.loanStatusHistory.create({
        data: { loanId: id, status: LoanStatus.ACTIVE, changedBy: analystId },
      });

      // Generar cuotas
      await this.generateInstallments(tx, l);

      // Registrar en ledger
      await tx.ledgerEntry.create({
        data: {
          userId:    l.userId,
          loanId:    l.id,
          type:      'DISBURSEMENT',
          amount:    l.approvedAmount,
          currency:  l.currency,
          reference: l.loanCode,
        },
      });

      return l;
    });

    this.logger.log(
      `✅ Préstamo desembolsado: ${updated.loanCode} userId=${updated.userId}`,
    );
    console.log(`✅ [LoanService.disburse] Préstamo desembolsado exitosamente: ${updated.loanCode}`);

    return this.toResponse(updated);
  }

  // ─── CREAR PRÉSTAMO DESDE SOLICITUD APROBADA ─────────────────

  async createFromApplication(
    dto: CreateLoanDto,
    analystId: number,
  ): Promise<LoanResponseDto> {
    console.log(`🔍 [LoanService.createFromApplication] Creando préstamo desde solicitud ${dto.loanApplicationId} por analyst=${analystId}`);

    // Verificar solicitud
    const application = await this.prisma.loanApplication.findUnique({
      where: { id: dto.loanApplicationId },
    });

    if (!application) {
      console.warn(`⚠️ [LoanService.createFromApplication] Solicitud ${dto.loanApplicationId} no encontrada`);
      throw new NotFoundException('Solicitud de préstamo no encontrada');
    }
    if (application.status !== ApplicationStatus.APPROVED) {
      console.warn(`⚠️ [LoanService.createFromApplication] Solicitud ${dto.loanApplicationId} está en estado ${application.status}`);
      throw new BadRequestException('La solicitud debe estar en estado APROBADA');
    }

    // Verificar que no tenga préstamo ya creado
    const existing = await this.prisma.loan.findUnique({
      where: { loanApplicationId: dto.loanApplicationId },
    });
    if (existing) {
      console.warn(`⚠️ [LoanService.createFromApplication] Solicitud ${dto.loanApplicationId} ya tiene préstamo creado: ${existing.loanCode}`);
      throw new BadRequestException('Esta solicitud ya tiene un préstamo creado');
    }

    const loanCode    = await this.repo.generateLoanCode();
    const interestRate = dto.interestRate;
    const termMonths   = application.requestedTerm;
    const totalAmount  = this.calcTotal(
      Number(dto.approvedAmount),
      interestRate,
      termMonths,
      dto.amortization ?? AmortizationType.FRENCH,
    );

    const loan = await this.repo.create({
      loanCode,
      requestedAmount: application.requestedAmount,
      approvedAmount:  dto.approvedAmount,
      interestRate,
      interestType:    dto.interestType  ?? InterestType.FIXED,
      amortization:    dto.amortization  ?? AmortizationType.FRENCH,
      totalAmount,
      termMonths,
      currency:        'PEN',
      status:          LoanStatus.APPROVED,
      approvedBy:      analystId,
      user:            { connect: { id: application.userId } },
      loanApplication: { connect: { id: dto.loanApplicationId } },
    });

    await this.repo.addStatusHistory(loan.id, LoanStatus.APPROVED, analystId);

    this.logger.log(
      `✅ Préstamo creado: ${loanCode} userId=${application.userId}`,
    );
    console.log(`✅ [LoanService.createFromApplication] Préstamo creado exitosamente: ${loanCode} para userId=${application.userId}`);

    return this.toResponse(loan);
  }

  // ─── CALCULAR AMORTIZACIÓN FRANCESA ──────────────────────────

  private calcTotal(
    amount: number,
    annualRate: number,
    months: number,
    type: AmortizationType,
  ): number {
    const monthly = annualRate / 12;

    if (type === AmortizationType.FRENCH) {
      // Cuota fija = P * [r(1+r)^n] / [(1+r)^n - 1]
      const factor = Math.pow(1 + monthly, months);
      const fee    = amount * (monthly * factor) / (factor - 1);
      return Math.round(fee * months * 100) / 100;
    }

    // Alemán: suma de intereses decrecientes
    const principal = amount / months;
    let total = 0;
    let balance = amount;
    for (let i = 0; i < months; i++) {
      total   += principal + balance * monthly;
      balance -= principal;
    }
    return Math.round(total * 100) / 100;
  }

  // ─── GENERAR CUOTAS ──────────────────────────────────────────

  private async generateInstallments(tx: any, loan: Loan): Promise<void> {
    const amount    = Number(loan.approvedAmount);
    const rate      = Number(loan.interestRate) / 12;
    const months    = loan.termMonths;
    const startDate = loan.disbursedAt ?? new Date();

    const installments = [];

    console.log(`🔍 [LoanService.generateInstallments] Generando ${months} cuotas para préstamo ${loan.loanCode}`);

    if (loan.amortization === AmortizationType.FRENCH) {
      const factor = Math.pow(1 + rate, months);
      const fee    = amount * (rate * factor) / (factor - 1);
      let   balance = amount;

      for (let i = 1; i <= months; i++) {
        const interest  = Math.round(balance * rate * 100) / 100;
        const principal = Math.round((fee - interest) * 100) / 100;
        const dueDate   = addMonths(startDate, i);

        installments.push({
          loanId:            loan.id,
          installmentNumber: i,
          principalAmount:   principal,
          interestAmount:    interest,
          totalAmount:       Math.round(fee * 100) / 100,
          currency:          loan.currency,
          dueDate,
        });

        balance -= principal;
      }
    } else {
      // Alemán
      const principal = Math.round((amount / months) * 100) / 100;
      let   balance   = amount;

      for (let i = 1; i <= months; i++) {
        const interest = Math.round(balance * rate * 100) / 100;
        const total    = Math.round((principal + interest) * 100) / 100;
        const dueDate  = addMonths(startDate, i);

        installments.push({
          loanId:            loan.id,
          installmentNumber: i,
          principalAmount:   principal,
          interestAmount:    interest,
          totalAmount:       total,
          currency:          loan.currency,
          dueDate,
        });

        balance -= principal;
      }
    }

    await tx.installment.createMany({ data: installments });
    this.logger.log(`${months} cuotas generadas para préstamo ${loan.loanCode}`);
    console.log(`✅ [LoanService.generateInstallments] ${installments.length} cuotas generadas para préstamo ${loan.loanCode}`);
  }

  // ─── MAPPER ──────────────────────────────────────────────────

  private toResponse(loan: Loan): LoanResponseDto {
    return {
      id:                loan.id,
      userId:            loan.userId,
      loanApplicationId: loan.loanApplicationId,
      loanCode:          loan.loanCode,
      requestedAmount:   Number(loan.requestedAmount),
      approvedAmount:    Number(loan.approvedAmount),
      interestRate:      Number(loan.interestRate),
      interestType:      loan.interestType,
      amortization:      loan.amortization,
      totalAmount:       Number(loan.totalAmount),
      termMonths:        loan.termMonths,
      currency:          loan.currency,
      disbursedAt:       loan.disbursedAt,
      dueDate:           loan.dueDate,
      status:            loan.status,
      createdAt:         loan.createdAt,
      updatedAt:         loan.updatedAt,
    };
  }
}
