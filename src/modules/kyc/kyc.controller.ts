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

  import { KycService }     from './kyc.service';
  import { UploadKycDto }   from './dto/upload-kyc.dto';
  import { KycResponseDto } from './dto/response/kyc-response.dto';
  import { JwtAuthGuard }   from '../../common/guards/jwt-auth.guard';
  import { RolesGuard }     from '../../common/guards/roles.guard';
  import { CurrentUser }    from '../../common/decorators/current-user.decorator';
  import { Roles }          from '../../common/decorators/roles.decorator';

  @ApiTags('KYC')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Controller('users/:userId/kyc')
  export class KycController {
    constructor(private readonly kycService: KycService) {}

    @Get()
    @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
    @ApiOperation({ summary: 'Obtener estado KYC del usuario' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 200, type: KycResponseDto })
    findOne(
      @Param('userId', ParseIntPipe) userId: number,
      @CurrentUser() user: User,
    ): Promise<KycResponseDto> {
      const targetId = user.role === 'CUSTOMER' ? user.id : userId;
      return this.kycService.findByUser(targetId);
    }

    @Post('upload')
    @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Subir documentos KYC' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 200, type: KycResponseDto })
    upload(
      @Param('userId', ParseIntPipe) userId: number,
      @Body() dto: UploadKycDto,
      @CurrentUser() user: User,
    ): Promise<KycResponseDto> {
      const targetId = user.role === 'CUSTOMER' ? user.id : userId;
      return this.kycService.upload(targetId, dto);
    }

    @Patch('verify')
    @Roles('ADMIN', 'ANALYST')
    @ApiOperation({ summary: 'Verificar KYC del usuario (solo ANALYST/ADMIN)' })
    @ApiParam({ name: 'userId', type: Number })
    @ApiResponse({ status: 200, type: KycResponseDto })
    verify(
      @Param('userId', ParseIntPipe) userId: number,
    ): Promise<KycResponseDto> {
      return this.kycService.verify(userId);
    }
  }
