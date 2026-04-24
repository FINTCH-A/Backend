// installment.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Installment, InstallmentStatus, User, UserRole } from '@prisma/client';
import { InstallmentRepository } from './installment.repository';
import { InstallmentResponseDto } from './dto/response/installment-response.dto';
import { PaginatedInstallmentResponseDto } from './dto/response/paginated-installment-response.dto';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class InstallmentService {
  constructor(
    private readonly repo: InstallmentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findByLoan(
    loanId: number,
    page: number,
    limit: number,
    currentUser: User,
  ): Promise<PaginatedInstallmentResponseDto> {
    // ✅ Verificar que el préstamo existe
    const loan = await this.prisma.loan.findFirst({
      where: { id: loanId, deletedAt: null },
      include: { user: true },
    });

    if (!loan) {
      throw new NotFoundException(`Préstamo #${loanId} no encontrado`);
    }

    // ✅ Permisos:
    // - ADMIN y ANALYST pueden ver cuotas de CUALQUIER préstamo
    // - CUSTOMER solo puede ver cuotas de SUS propios préstamos
    if (currentUser.role === UserRole.CUSTOMER && loan.userId !== currentUser.id) {
      throw new ForbiddenException('No tienes permiso para ver las cuotas de este préstamo');
    }

    const result = await this.repo.findByLoan(loanId, page, limit);
    return {
      data: result.data.map(this.toResponse),
      meta: result.meta,
    };
  }

  async findOne(id: number, currentUser: User): Promise<InstallmentResponseDto> {
    const installment = await this.repo.findById(id);
    if (!installment) {
      throw new NotFoundException(`Cuota #${id} no encontrada`);
    }

    // ✅ Verificar permisos
    const loan = await this.prisma.loan.findFirst({
      where: { id: installment.loanId, deletedAt: null },
    });

    if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.ANALYST) {
      if (loan?.userId !== currentUser.id) {
        throw new ForbiddenException('No tienes permiso para ver esta cuota');
      }
    }

    return this.toResponse(installment);
  }

  async findNextDue(loanId: number, currentUser: User): Promise<InstallmentResponseDto | null> {
    // ✅ Verificar permisos
    const loan = await this.prisma.loan.findFirst({
      where: { id: loanId, deletedAt: null },
    });

    if (!loan) {
      throw new NotFoundException(`Préstamo #${loanId} no encontrado`);
    }

    if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.ANALYST) {
      if (loan.userId !== currentUser.id) {
        throw new ForbiddenException('No tienes permiso para ver este préstamo');
      }
    }

    const installment = await this.repo.findNextDue(loanId);
    if (!installment) return null;
    return this.toResponse(installment);
  }

  async markOverdueInstallments(): Promise<{ updated: number }> {
    const count = await this.repo.markOverdue();
    return { updated: count };
  }

  private toResponse(inst: Installment): InstallmentResponseDto {
    const total   = Number(inst.totalAmount);
    const paid    = Number(inst.paidAmount);
    const pending = Math.max(0, total - paid);
    const today   = new Date();
    const due     = new Date(inst.dueDate);
    const isOverdue =
      inst.status === InstallmentStatus.OVERDUE ||
      (inst.status === InstallmentStatus.PENDING && due < today);

    return {
      id:                inst.id,
      loanId:            inst.loanId,
      installmentNumber: inst.installmentNumber,
      principalAmount:   Number(inst.principalAmount),
      interestAmount:    Number(inst.interestAmount),
      totalAmount:       total,
      paidAmount:        paid,
      pendingAmount:     pending,
      currency:          inst.currency,
      dueDate:           inst.dueDate,
      paidAt:            inst.paidAt,
      status:            inst.status,
      lateFee:           inst.lateFee ? Number(inst.lateFee) : null,
      daysOverdue:       inst.daysOverdue,
      isOverdue,
      createdAt:         inst.createdAt,
      updatedAt:         inst.updatedAt,
    };
  }
}
