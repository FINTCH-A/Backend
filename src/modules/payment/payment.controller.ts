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

import { PaymentService }              from './payment.service';
import { CreatePaymentDto }            from './dto/create-payment.dto';
import { QueryPaymentDto }             from './dto/query-payment.dto';
import { PaymentResponseDto }          from './dto/response/payment-response.dto';
import { PaginatedPaymentResponseDto } from './dto/response/paginated-payment-response.dto';
import { JwtAuthGuard }                from '../../common/guards/jwt-auth.guard';
import { RolesGuard }                  from '../../common/guards/roles.guard';
import { CurrentUser }                 from '../../common/decorators/current-user.decorator';
import { Roles }                       from '../../common/decorators/roles.decorator';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Listar pagos' })
  @ApiResponse({ status: 200, type: PaginatedPaymentResponseDto })
  findAll(
    @Query() query: QueryPaymentDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedPaymentResponseDto> {
    // CUSTOMER solo ve sus propios pagos
    if (user.role === 'CUSTOMER') {
      query = { ...query, userId: user.id } as any;
    }
    return this.paymentService.findAll(query, user);
  }

  @Get(':id')
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Obtener pago por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo pago' })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: User,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.create(dto, user);
  }

  @Patch(':id/reverse')
  @Roles('ADMIN', 'ANALYST')
  @ApiOperation({ summary: 'Revertir pago' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  reverse(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.reverse(id, user.id);
  }
}
