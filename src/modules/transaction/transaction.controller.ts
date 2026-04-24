import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Query,
    UseGuards,
  } from '@nestjs/common';
  import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
  } from '@nestjs/swagger';

  import { TransactionService }             from './transaction.service';
  import { CreateTransactionDto }           from './dto/create-transaction.dto';
  import { QueryTransactionDto }            from './dto/query-transaction.dto';
  import { TransactionResponseDto }         from './dto/response/transaction-response.dto';
  import { PaginatedTransactionResponseDto } from './dto/response/paginated-transaction-response.dto';
  import { JwtAuthGuard }                   from '../../common/guards/jwt-auth.guard';
  import { RolesGuard }                     from '../../common/guards/roles.guard';
  import { Roles }                          from '../../common/decorators/roles.decorator';

  @ApiTags('Transactions')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Controller('transactions')
  export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    @Get()
    @Roles('ADMIN', 'ANALYST')
    @ApiOperation({ summary: 'Listar transacciones externas' })
    @ApiResponse({ status: 200, type: PaginatedTransactionResponseDto })
    findAll(
      @Query() query: QueryTransactionDto,
    ): Promise<PaginatedTransactionResponseDto> {
      return this.transactionService.findAll(query);
    }

    @Get('payment/:paymentId')
    @Roles('ADMIN', 'ANALYST')
    @ApiOperation({ summary: 'Obtener transacción por ID de pago' })
    @ApiParam({ name: 'paymentId', type: Number })
    findByPayment(
      @Param('paymentId', ParseIntPipe) paymentId: number,
    ): Promise<TransactionResponseDto | null> {
      return this.transactionService.findByPayment(paymentId);
    }

    @Get(':id')
    @Roles('ADMIN', 'ANALYST')
    @ApiOperation({ summary: 'Obtener transacción por ID' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, type: TransactionResponseDto })
    findOne(
      @Param('id', ParseIntPipe) id: number,
    ): Promise<TransactionResponseDto> {
      return this.transactionService.findOne(id);
    }

    @Post()
    @Roles('ADMIN', 'ANALYST')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Registrar transacción externa (Yape, Plin, Banco)' })
    @ApiResponse({ status: 201, type: TransactionResponseDto })
    create(
      @Body() dto: CreateTransactionDto,
    ): Promise<TransactionResponseDto> {
      return this.transactionService.create(dto);
    }
  }
