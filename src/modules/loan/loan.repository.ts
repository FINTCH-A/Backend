import { Injectable } from '@nestjs/common';
import { Loan, LoanStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  getPaginationParams,
  paginate,
  PaginatedResult,
} from '../../common/utils/pagination.util';

export interface LoanFilter {
  page?:   number;
  limit?:  number;
  userId?: number;
  status?: LoanStatus;
}

@Injectable()
export class LoanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: LoanFilter): Promise<PaginatedResult<Loan>> {
    // ============================================================
    // LOGS PARA DEBUG - Verificar qué filter está llegando
    // ============================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [LoanRepository.findAll] FILTER RECIBIDO:', JSON.stringify(filter, null, 2));
    console.log('🔍 [LoanRepository.findAll] userId específico:', filter.userId);
    console.log('🔍 [LoanRepository.findAll] status específico:', filter.status);

    const { page = 1, limit = 10, userId, status } = filter;
    const { take, skip } = getPaginationParams(page, limit);

    console.log(`🔍 [LoanRepository.findAll] Paginación: page=${page}, limit=${limit}, take=${take}, skip=${skip}`);

    const where: Prisma.LoanWhereInput = {
      deletedAt: null,
      ...(userId !== undefined && userId !== null && { userId }), // Mejorado para manejar userId=0
      ...(status && { status }),
    };

    // ============================================================
    // LOG - Verificar el WHERE construido
    // ============================================================
    console.log('🔍 [LoanRepository.findAll] WHERE clause construida:', JSON.stringify(where, null, 2));

    // Verificar si hay userId en el filtro
    if (userId) {
      console.log(`✅ [LoanRepository.findAll] Filtrando por userId = ${userId}`);
    } else {
      console.warn('⚠️ [LoanRepository.findAll] NO hay userId en el filtro - se devolverán TODOS los préstamos no eliminados');
    }

    const [data, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loan.count({ where }),
    ]);

    // ============================================================
    // LOG - Resultados encontrados
    // ============================================================
    console.log(`📊 [LoanRepository.findAll] RESULTADOS: ${data.length} préstamos encontrados de ${total} totales`);

    if (data.length > 0) {
      console.log(`📋 [LoanRepository.findAll] IDs de préstamos encontrados: ${data.map(l => l.id).join(', ')}`);
      console.log(`📋 [LoanRepository.findAll] userIds de préstamos encontrados: ${[...new Set(data.map(l => l.userId))].join(', ')}`);
    } else {
      console.warn(`⚠️ [LoanRepository.findAll] No se encontraron préstamos con el filtro aplicado`);

      // Log adicional para debugging - verificar si existen préstamos en la DB
      const totalLoans = await this.prisma.loan.count({ where: { deletedAt: null } });
      console.log(`📊 [LoanRepository.findAll] Total de préstamos en DB (sin filtrar): ${totalLoans}`);

      if (totalLoans > 0 && userId) {
        // Verificar si hay préstamos para este userId específico
        const loansForUser = await this.prisma.loan.count({
          where: { deletedAt: null, userId }
        });
        console.log(`📊 [LoanRepository.findAll] Préstamos para userId=${userId}: ${loansForUser}`);

        if (loansForUser === 0) {
          console.warn(`⚠️ [LoanRepository.findAll] El userId=${userId} NO tiene préstamos en la base de datos`);
        }
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return { data, meta: paginate(total, page, limit) };
  }

  async findById(id: number): Promise<Loan | null> {
    console.log(`🔍 [LoanRepository.findById] Buscando préstamo id=${id}`);

    const loan = await this.prisma.loan.findFirst({
      where: { id, deletedAt: null },
      include: {
        installments:  { orderBy: { installmentNumber: 'asc' } },
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (loan) {
      console.log(`✅ [LoanRepository.findById] Préstamo encontrado: ${loan.loanCode} para userId=${loan.userId}`);
    } else {
      console.warn(`⚠️ [LoanRepository.findById] Préstamo id=${id} NO encontrado`);
    }

    return loan;
  }

  async findByCode(loanCode: string): Promise<Loan | null> {
    console.log(`🔍 [LoanRepository.findByCode] Buscando préstamo con código: ${loanCode}`);

    const loan = await this.prisma.loan.findUnique({ where: { loanCode } });

    if (loan) {
      console.log(`✅ [LoanRepository.findByCode] Préstamo encontrado: id=${loan.id} para userId=${loan.userId}`);
    } else {
      console.warn(`⚠️ [LoanRepository.findByCode] Préstamo con código ${loanCode} NO encontrado`);
    }

    return loan;
  }

  async findByUserAndId(userId: number, id: number): Promise<Loan | null> {
    console.log(`🔍 [LoanRepository.findByUserAndId] Buscando préstamo id=${id} para userId=${userId}`);

    const loan = await this.prisma.loan.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (loan) {
      console.log(`✅ [LoanRepository.findByUserAndId] Préstamo encontrado: ${loan.loanCode}`);
    } else {
      console.warn(`⚠️ [LoanRepository.findByUserAndId] Préstamo id=${id} NO encontrado para userId=${userId}`);
    }

    return loan;
  }

  async create(data: Prisma.LoanCreateInput): Promise<Loan> {
    console.log(`🔍 [LoanRepository.create] Creando nuevo préstamo con código: ${data.loanCode}`);

    const loan = await this.prisma.loan.create({ data });

    console.log(`✅ [LoanRepository.create] Préstamo creado: id=${loan.id}, código=${loan.loanCode}, userId=${loan.userId}`);

    return loan;
  }

  async update(id: number, data: Prisma.LoanUpdateInput): Promise<Loan> {
    console.log(`🔍 [LoanRepository.update] Actualizando préstamo id=${id}`);

    const loan = await this.prisma.loan.update({ where: { id }, data });

    console.log(`✅ [LoanRepository.update] Préstamo actualizado: ${loan.loanCode} - nuevo status: ${loan.status}`);

    return loan;
  }

  async addStatusHistory(
    loanId: number,
    status: LoanStatus,
    changedBy?: number,
  ): Promise<void> {
    console.log(`🔍 [LoanRepository.addStatusHistory] loanId=${loanId}, status=${status}, changedBy=${changedBy ?? 'sistema'}`);

    await this.prisma.loanStatusHistory.create({
      data: { loanId, status, changedBy: changedBy ?? null },
    });

    console.log(`✅ [LoanRepository.addStatusHistory] Historial agregado para préstamo ${loanId}`);
  }

  async generateLoanCode(): Promise<string> {
    const date   = new Date();
    const year   = date.getFullYear().toString().slice(-2);
    const month  = String(date.getMonth() + 1).padStart(2, '0');
    const count  = await this.prisma.loan.count();
    const seq    = String(count + 1).padStart(6, '0');
    const code   = `AV${year}${month}-${seq}`;

    console.log(`🔍 [LoanRepository.generateLoanCode] Nuevo código generado: ${code} (basado en ${count} préstamos existentes)`);

    return code;
  }
}
