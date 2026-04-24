import {
    ConflictException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { ExternalTransaction } from '@prisma/client';

  import { TransactionRepository }          from './transaction.repository';
  import { CreateTransactionDto }           from './dto/create-transaction.dto';
  import { QueryTransactionDto }            from './dto/query-transaction.dto';
  import { TransactionResponseDto }         from './dto/response/transaction-response.dto';
  import { PaginatedTransactionResponseDto } from './dto/response/paginated-transaction-response.dto';

  @Injectable()
  export class TransactionService {
    constructor(private readonly repo: TransactionRepository) {}

    async findAll(
      query: QueryTransactionDto,
    ): Promise<PaginatedTransactionResponseDto> {
      const result = await this.repo.findAll(query);
      return {
        data: result.data.map(this.toResponse),
        meta: result.meta,
      };
    }

    async findOne(id: number): Promise<TransactionResponseDto> {
      const tx = await this.repo.findById(id);
      if (!tx) throw new NotFoundException(`Transacción #${id} no encontrada`);
      return this.toResponse(tx);
    }

    async findByPayment(paymentId: number): Promise<TransactionResponseDto | null> {
      const tx = await this.repo.findByPayment(paymentId);
      if (!tx) return null;
      return this.toResponse(tx);
    }

    async create(dto: CreateTransactionDto): Promise<TransactionResponseDto> {
      // Verificar duplicado por externalId
      const existing = await this.repo.findByExternalId(dto.externalId);
      if (existing) {
        throw new ConflictException(
          `Ya existe una transacción con externalId '${dto.externalId}'`,
        );
      }

      const tx = await this.repo.create({
        provider:   dto.provider,
        externalId: dto.externalId,
        status:     dto.status,
        response:   dto.response ?? {},
        payment:    { connect: { id: dto.paymentId } },
      });

      return this.toResponse(tx);
    }

    private toResponse(tx: ExternalTransaction): TransactionResponseDto {
      return {
        id:         tx.id,
        paymentId:  tx.paymentId,
        provider:   tx.provider,
        externalId: tx.externalId,
        status:     tx.status,
        response:   tx.response,
        createdAt:  tx.createdAt,
      };
    }
  }
