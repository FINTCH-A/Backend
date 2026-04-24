import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Put,
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

  import { FinancialInfoService }      from './financial-info.service';
  import { CreateFinancialInfoDto }    from './dto/create-financial-info.dto';
  import { FinancialInfoResponseDto }  from './dto/response/financial-info-response.dto';
  import { JwtAuthGuard }              from '../../common/guards/jwt-auth.guard';
  import { RolesGuard }                from '../../common/guards/roles.guard';
  import { CurrentUser }               from '../../common/decorators/current-user.decorator';
  import { Roles }                     from '../../common/decorators/roles.decorator';

  @ApiTags('Financial Info')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Controller('users/:userId/financial-info')
  export class FinancialInfoController {
    constructor(private readonly financialInfoService: FinancialInfoService) {}

    @Get()
    @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
    @ApiOperation({ summary: 'Obtener información financiera del usuario' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 200, type: FinancialInfoResponseDto })
    findOne(
      @Param('userId', ParseIntPipe) userId: number,
      @CurrentUser() user: User,
    ): Promise<FinancialInfoResponseDto> {
      const targetId = user.role === 'CUSTOMER' ? user.id : userId;
      return this.financialInfoService.findByUser(targetId);
    }

    @Put()
    @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
    @ApiOperation({ summary: 'Crear o actualizar información financiera' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 200, type: FinancialInfoResponseDto })
    upsert(
      @Param('userId', ParseIntPipe) userId: number,
      @Body() dto: CreateFinancialInfoDto,
      @CurrentUser() user: User,
    ): Promise<FinancialInfoResponseDto> {
      const targetId = user.role === 'CUSTOMER' ? user.id : userId;
      return this.financialInfoService.upsert(targetId, dto);
    }
  }
