import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@prisma/client';

import { InstallmentService }              from './installment.service';
import { InstallmentResponseDto }          from './dto/response/installment-response.dto';
import { PaginatedInstallmentResponseDto } from './dto/response/paginated-installment-response.dto';
import { JwtAuthGuard }                    from '../../common/guards/jwt-auth.guard';
import { RolesGuard }                      from '../../common/guards/roles.guard';
import { CurrentUser }                     from '../../common/decorators/current-user.decorator';
import { Roles }                           from '../../common/decorators/roles.decorator';

@ApiTags('Installments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loans/:loanId/installments')
export class InstallmentController {
  constructor(private readonly installmentService: InstallmentService) {}

  @Get()
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Listar cuotas de un préstamo' })
  @ApiParam({ name: 'loanId', type: Number })
  @ApiQuery({ name: 'page',  required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: PaginatedInstallmentResponseDto })
  findAll(
    @Param('loanId', ParseIntPipe) loanId: number,
    @Query('page')  page  = 1,
    @Query('limit') limit = 60,
    @CurrentUser() user: User,
  ): Promise<PaginatedInstallmentResponseDto> {
    return this.installmentService.findByLoan(loanId, +page, +limit, user);
  }

  @Get('next-due')
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Obtener la próxima cuota pendiente' })
  @ApiParam({ name: 'loanId', type: Number })
  @ApiResponse({ status: 200, type: InstallmentResponseDto })
  nextDue(
    @Param('loanId', ParseIntPipe) loanId: number,
    @CurrentUser() user: User,
  ): Promise<InstallmentResponseDto | null> {
    return this.installmentService.findNextDue(loanId, user);
  }

  @Get(':id')
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Obtener cuota por ID' })
  @ApiParam({ name: 'loanId', type: Number })
  @ApiParam({ name: 'id',     type: Number })
  @ApiResponse({ status: 200, type: InstallmentResponseDto })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<InstallmentResponseDto> {
    return this.installmentService.findOne(id, user);
  }
}
