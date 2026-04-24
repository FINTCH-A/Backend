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

  import { LedgerService }              from './ledger.service';
  import { CreateLedgerEntryDto }       from './dto/create-ledger-entry.dto';
  import { QueryLedgerDto }             from './dto/query-ledger.dto';
  import { LedgerEntryResponseDto }     from './dto/response/ledger-entry-response.dto';
  import { PaginatedLedgerResponseDto } from './dto/response/paginated-ledger-response.dto';
  import { JwtAuthGuard }               from '../../common/guards/jwt-auth.guard';
  import { RolesGuard }                 from '../../common/guards/roles.guard';
  import { Roles }                      from '../../common/decorators/roles.decorator';

  @ApiTags('Ledger')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Controller('ledger')
  export class LedgerController {
    constructor(private readonly ledgerService: LedgerService) {}

    @Get()
    @Roles('ADMIN', 'ANALYST')
    @ApiOperation({ summary: 'Listar entradas contables' })
    @ApiResponse({ status: 200, type: PaginatedLedgerResponseDto })
    findAll(@Query() query: QueryLedgerDto): Promise<PaginatedLedgerResponseDto> {
      return this.ledgerService.findAll(query);
    }

    @Get('loans/:loanId/balance')
    @Roles('ADMIN', 'ANALYST')
    @ApiOperation({ summary: 'Balance contable de un préstamo' })
    @ApiParam({ name: 'loanId', type: Number })
    getBalance(@Param('loanId', ParseIntPipe) loanId: number) {
      return this.ledgerService.getBalanceByLoan(loanId);
    }

    @Get(':id')
    @Roles('ADMIN', 'ANALYST')
    @ApiOperation({ summary: 'Obtener entrada contable por ID' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, type: LedgerEntryResponseDto })
    findOne(
      @Param('id', ParseIntPipe) id: number,
    ): Promise<LedgerEntryResponseDto> {
      return this.ledgerService.findOne(id);
    }

    @Post()
    @Roles('ADMIN')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Crear entrada contable manual (solo ADMIN)' })
    @ApiResponse({ status: 201, type: LedgerEntryResponseDto })
    create(
      @Body() dto: CreateLedgerEntryDto,
    ): Promise<LedgerEntryResponseDto> {
      return this.ledgerService.create(dto);
    }
  }
