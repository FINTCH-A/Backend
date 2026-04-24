import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
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

  import { PaymentMethodService }     from './payment-method.service';
  import { CreatePaymentMethodDto }   from './dto/create-payment-method.dto';
  import { UpdatePaymentMethodDto }   from './dto/update-payment-method.dto';
  import { PaymentMethodResponseDto } from './dto/response/payment-method-response.dto';
  import { JwtAuthGuard }             from '../../common/guards/jwt-auth.guard';
  import { RolesGuard }               from '../../common/guards/roles.guard';
  import { CurrentUser }              from '../../common/decorators/current-user.decorator';
  import { Roles }                    from '../../common/decorators/roles.decorator';

  @ApiTags('Payment Methods')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Controller('users/:userId/payment-methods')
  export class PaymentMethodController {
    constructor(private readonly paymentMethodService: PaymentMethodService) {}

    @Get()
    @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
    @ApiOperation({ summary: 'Listar métodos de pago del usuario' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 200, type: [PaymentMethodResponseDto] })
    findAll(
      @Param('userId', ParseIntPipe) userId: number,
      @CurrentUser() user: User,
    ): Promise<PaymentMethodResponseDto[]> {
      const targetId = user.role === 'CUSTOMER' ? user.id : userId;
      return this.paymentMethodService.findAllByUser(targetId);
    }

    @Get(':id')
    @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
    @ApiOperation({ summary: 'Obtener método de pago por ID' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, type: PaymentMethodResponseDto })
    findOne(
      @Param('userId', ParseIntPipe) userId: number,
      @Param('id', ParseIntPipe) id: number,
      @CurrentUser() user: User,
    ): Promise<PaymentMethodResponseDto> {
      const targetId = user.role === 'CUSTOMER' ? user.id : userId;
      const isAdmin  = user.role === 'ADMIN';
      return this.paymentMethodService.findOne(id, targetId, isAdmin);
    }

    @Post()
    @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Registrar nuevo método de pago' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 201, type: PaymentMethodResponseDto })
    @ApiResponse({ status: 409, description: 'Método de pago ya registrado' })
    create(
      @Param('userId', ParseIntPipe) userId: number,
      @Body() dto: CreatePaymentMethodDto,
      @CurrentUser() user: User,
    ): Promise<PaymentMethodResponseDto> {
      const targetId = user.role === 'CUSTOMER' ? user.id : userId;
      return this.paymentMethodService.create(targetId, dto);
    }

    @Patch(':id')
    @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
    @ApiOperation({ summary: 'Actualizar método de pago' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, type: PaymentMethodResponseDto })
    update(
      @Param('userId', ParseIntPipe) userId: number,
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: UpdatePaymentMethodDto,
      @CurrentUser() user: User,
    ): Promise<PaymentMethodResponseDto> {
      const targetId = user.role === 'CUSTOMER' ? user.id : userId;
      return this.paymentMethodService.update(id, targetId, dto);
    }

    @Delete(':id')
    @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar método de pago' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 204 })
    remove(
      @Param('userId', ParseIntPipe) userId: number,
      @Param('id', ParseIntPipe) id: number,
      @CurrentUser() user: User,
    ): Promise<void> {
      const targetId = user.role === 'CUSTOMER' ? user.id : userId;
      return this.paymentMethodService.remove(id, targetId);
    }
  }
