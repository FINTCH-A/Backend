import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
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
import { User } from '@prisma/client';

import { LoanService }              from './loan.service';
import { CreateLoanDto }            from './dto/create-loan.dto';
import { LoanResponseDto }          from './dto/response/loan-response.dto';
import { PaginatedLoanResponseDto } from './dto/response/paginated-loan-response.dto';
import { JwtAuthGuard }             from '../../common/guards/jwt-auth.guard';
import { RolesGuard }               from '../../common/guards/roles.guard';
import { CurrentUser }              from '../../common/decorators/current-user.decorator';
import { Roles }                    from '../../common/decorators/roles.decorator';

@ApiTags('Loans')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Get()
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Listar préstamos' })
  @ApiResponse({ status: 200, type: PaginatedLoanResponseDto })
  findAll(
    @Query() query: any,
    @CurrentUser() user: User,
  ): Promise<PaginatedLoanResponseDto> {
    // ============================================================
    // CORRECCIÓN 2: Para CUSTOMER, IGNORAR completamente el userId del query
    // ============================================================
    let filter: any = { ...query }; // Copiar para no mutar el original

    if (user.role === 'CUSTOMER') {
      // NO enviar userId desde el query, el service usará currentUser.id
      delete filter.userId;
      // También podemos pasar un flag para que el service sepa que es customer
      filter.isCustomer = true;
    }

    // Pasar el user completo al service
    return this.loanService.findAll(filter, user);
  }

  @Get(':id')
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Obtener préstamo por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: LoanResponseDto })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<LoanResponseDto> {
    return this.loanService.findOne(id, user);
  }

  @Post()
  @Roles('ADMIN', 'ANALYST')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear préstamo desde solicitud aprobada' })
  @ApiResponse({ status: 201, type: LoanResponseDto })
  create(
    @Body() dto: CreateLoanDto,
    @CurrentUser() user: User,
  ): Promise<LoanResponseDto> {
    return this.loanService.createFromApplication(dto, user.id);
  }

  @Patch(':id/disburse')
  @Roles('ADMIN', 'ANALYST')
  @ApiOperation({ summary: 'Desembolsar préstamo aprobado' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: LoanResponseDto })
  disburse(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<LoanResponseDto> {
    return this.loanService.disburse(id, user.id);
  }
}
