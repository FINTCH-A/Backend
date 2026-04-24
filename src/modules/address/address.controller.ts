import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
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

  import { AddressService }     from './address.service';
  import { CreateAddressDto }   from './dto/create-address.dto';
  import { AddressResponseDto } from './dto/response/address-response.dto';
  import { JwtAuthGuard }       from '../../common/guards/jwt-auth.guard';
  import { RolesGuard }         from '../../common/guards/roles.guard';
  import { CurrentUser }        from '../../common/decorators/current-user.decorator';
  import { Roles }              from '../../common/decorators/roles.decorator';

  @ApiTags('Address')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Controller('users/:userId/address')
  export class AddressController {
    constructor(private readonly addressService: AddressService) {}

    @Get()
    @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
    @ApiOperation({ summary: 'Obtener dirección del usuario' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 200, type: AddressResponseDto })
    findOne(
      @Param('userId', ParseIntPipe) userId: number,
      @CurrentUser() user: User,
    ): Promise<AddressResponseDto> {
      const targetId = user.role === 'CUSTOMER' ? user.id : userId;
      return this.addressService.findByUser(targetId);
    }

    @Put()
    @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
    @ApiOperation({ summary: 'Crear o actualizar dirección del usuario' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 200, type: AddressResponseDto })
    upsert(
      @Param('userId', ParseIntPipe) userId: number,
      @Body() dto: CreateAddressDto,
      @CurrentUser() user: User,
    ): Promise<AddressResponseDto> {
      const targetId = user.role === 'CUSTOMER' ? user.id : userId;
      return this.addressService.upsert(targetId, dto);
    }

    @Delete()
    @Roles('ADMIN')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar dirección del usuario' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 204 })
    remove(
      @Param('userId', ParseIntPipe) userId: number,
    ): Promise<void> {
      return this.addressService.remove(userId);
    }
  }
