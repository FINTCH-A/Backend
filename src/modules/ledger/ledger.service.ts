import { Injectable, NotFoundException } from '@nestjs/common';
import { LedgerEntry } from '@prisma/client';

import { LedgerRepository, LedgerFilter } from './ledger.repository';
import { CreateLedgerEntryDto }           from './dto/create-ledger-entry.dto';
import { QueryLedgerDto }                 from './dto/query-ledger.dto';
import { LedgerEntryResponseDto }         from './dto/response/ledger-entry-response.dto';
import { PaginatedLedgerResponseDto }     from './dto/response/paginated-ledger-response.dto';

@Injectable()
export class LedgerService {
  constructor(private readonly repo: LedgerRepository) {}

  async findAll(query: QueryLedgerDto): Promise<PaginatedLedgerResponseDto> {
    const result = await this.repo.findAll({
      page:   query.page,
      limit:  query.limit,
      userId: query.userId,
      loanId: query.loanId,
      type:   query.type,
    });
    return {
      data: result.data.map(this.toResponse),
      meta: result.meta,
    };
  }

  async findOne(id: number): Promise<LedgerEntryResponseDto> {
    const entry = await this.repo.findById(id);
    if (!entry) throw new NotFoundException(`Entrada contable #${id} no encontrada`);
    return this.toResponse(entry);
  }

  async create(dto: CreateLedgerEntryDto): Promise<LedgerEntryResponseDto> {
    const entry = await this.repo.create({
      type:      dto.type,
      amount:    dto.amount,
      currency:  dto.currency ?? 'PEN',
      reference: dto.reference ?? null,
      metadata:  dto.metadata  ?? null,
      user:      { connect: { id: dto.userId } },
      ...(dto.loanId    && { loan:    { connect: { id: dto.loanId } } }),
      ...(dto.paymentId && { payment: { connect: { id: dto.paymentId } } }),
    });
    return this.toResponse(entry);
  }

  async getBalanceByLoan(loanId: number) {
    const balance = await this.repo.getBalanceByLoan(loanId);
    const disbursed  = balance['DISBURSEMENT'] ?? 0;
    const repaid     = balance['REPAYMENT']    ?? 0;
    const interest   = balance['INTEREST']     ?? 0;
    const penalty    = balance['PENALTY']      ?? 0;
    const reversals  = balance['REVERSAL']     ?? 0;

    return {
      loanId,
      disbursed,
      repaid,
      interest,
      penalty,
      reversals,
      outstanding: disbursed - repaid + interest + penalty - reversals,
    };
  }

  private toResponse(entry: LedgerEntry): LedgerEntryResponseDto {
    return {
      id:        entry.id,
      userId:    entry.userId,
      loanId:    entry.loanId,
      paymentId: entry.paymentId,
      type:      entry.type,
      amount:    Number(entry.amount),
      currency:  entry.currency,
      reference: entry.reference,
      metadata:  entry.metadata,
      createdAt: entry.createdAt,
    };
  }
}
