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

  import { FamilyInfoService }     from './family-info.service';
  import { CreateFamilyInfoDto }   from './dto/create-family-info.dto';
  import { FamilyInfoResponseDto } from './dto/response/family-info-response.dto';
  import { JwtAuthGuard }          from '../../common/guards/jwt-auth.guard';
  import { RolesGuard }            from '../../common/guards/roles.guard';
  import { CurrentUser }           from '../../common/decorators/current-user.decorator';
  import { Roles }                 from '../../common/decorators/roles.decorator';

  @ApiTags('Family Info')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Controller('users/:userId/family-info')
  export class FamilyInfoController {
    constructor(private readonly familyInfoService: FamilyInfoService) {}

    @Get()
    @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
    @ApiOperation({ summary: 'Obtener información familiar del usuario' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 200, type: FamilyInfoResponseDto })
    findOne(
      @Param('userId', ParseIntPipe) userId: number,
      @CurrentUser() user: User,
    ): Promise<FamilyInfoResponseDto> {
      const targetId = user.role === 'CUSTOMER' ? user.id : userId;
      return this.familyInfoService.findByUser(targetId);
    }

    @Put()
    @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
    @ApiOperation({ summary: 'Crear o actualizar información familiar' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 200, type: FamilyInfoResponseDto })
    upsert(
      @Param('userId', ParseIntPipe) userId: number,
      @Body() dto: CreateFamilyInfoDto,
      @CurrentUser() user: User,
    ): Promise<FamilyInfoResponseDto> {
      const targetId = user.role === 'CUSTOMER' ? user.id : userId;
      return this.familyInfoService.upsert(targetId, dto);
    }
  }
