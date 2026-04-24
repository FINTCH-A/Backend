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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApplicationStatus, User } from '@prisma/client';
import { Request } from 'express';

import { LoanApplicationService }  from './loan-application.service';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { UpdateLoanApplicationDto } from './dto/update-loan-application.dto';
import { ReviewLoanApplicationDto } from './dto/review-loan-application.dto';
import { LoanApplicationResponseDto } from './dto/response/loan-application-response.dto';
import { PaginatedLoanApplicationResponseDto } from './dto/response/paginated-loan-application-response.dto';
import { JwtAuthGuard }  from '../../common/guards/jwt-auth.guard';
import { RolesGuard }    from '../../common/guards/roles.guard';
import { CurrentUser }   from '../../common/decorators/current-user.decorator';
import { Roles }         from '../../common/decorators/roles.decorator';

@ApiTags('Loan Application')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loan-applications')
export class LoanApplicationController {
  constructor(private readonly service: LoanApplicationService) {}

  @Get()
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Listar solicitudes de préstamo' })
  @ApiResponse({ status: 200, type: PaginatedLoanApplicationResponseDto })
  findAll(
    @Query() query: any,
    @CurrentUser() user: User,
  ): Promise<PaginatedLoanApplicationResponseDto> {
    // CUSTOMER solo ve sus propias solicitudes
    if (user.role === 'CUSTOMER') {
      query.userId = user.id;
    }
    return this.service.findAll(query, user);
  }

  @Get(':id')
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Obtener solicitud por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: LoanApplicationResponseDto })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<LoanApplicationResponseDto> {
    return this.service.findOne(id, user);
  }

  @Post()
  @Roles('CUSTOMER', 'ADMIN', 'ANALYST')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear solicitud de préstamo' })
  @ApiResponse({ status: 201, type: LoanApplicationResponseDto })
  create(
    @Body() dto: CreateLoanApplicationDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<LoanApplicationResponseDto> {
    return this.service.create(dto, user, this.getIp(req));
  }

  @Patch(':id')
  @Roles('CUSTOMER', 'ADMIN', 'ANALYST')
  @ApiOperation({ summary: 'Actualizar solicitud en estado BORRADOR' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: LoanApplicationResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLoanApplicationDto,
    @CurrentUser() user: User,
  ): Promise<LoanApplicationResponseDto> {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/submit')
  @Roles('CUSTOMER', 'ADMIN', 'ANALYST')
  @ApiOperation({ summary: 'Enviar solicitud para revisión' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: LoanApplicationResponseDto })
  submit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<LoanApplicationResponseDto> {
    return this.service.submit(id, user);
  }

  @Patch(':id/review')
  @Roles('ADMIN', 'ANALYST')
  @ApiOperation({ summary: 'Revisar solicitud' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: LoanApplicationResponseDto })
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewLoanApplicationDto,
    @CurrentUser() user: User,
  ): Promise<LoanApplicationResponseDto> {
    return this.service.review(id, dto, user.id);
  }

  @Patch(':id/cancel')
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Cancelar solicitud' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: LoanApplicationResponseDto })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<LoanApplicationResponseDto> {
    return this.service.cancel(id, user);
  }

  private getIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }
}
