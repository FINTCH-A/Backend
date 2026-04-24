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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User, NotificationType } from '@prisma/client';

import { NotificationService }     from './notification.service';
import { CreateNotificationDto }   from './dto/create-notification.dto';
import { NotificationResponseDto } from './dto/response/notification-response.dto';
import { JwtAuthGuard }            from '../../common/guards/jwt-auth.guard';
import { RolesGuard }              from '../../common/guards/roles.guard';
import { CurrentUser }             from '../../common/decorators/current-user.decorator';
import { Roles }                   from '../../common/decorators/roles.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Listar notificaciones del usuario autenticado' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'onlyUnread', required: false, type: Boolean })
  findAll(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('onlyUnread') onlyUnread?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const onlyUnreadBool = onlyUnread === 'true';

    return this.notificationService.findByUser(
      user.id,
      user.role,
      pageNum,
      limitNum,
      onlyUnreadBool,
    );
  }

  @Post()
  @Roles('ADMIN', 'ANALYST')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear notificación manual' })
  @ApiResponse({ status: 201, type: NotificationResponseDto })
  create(@Body() dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    return this.notificationService.create(dto);
  }

  @Post('system')
  @Roles('ADMIN', 'ANALYST')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear notificación del sistema (para todos)' })
  async createSystemNotification(@Body() dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    // ✅ Asegurar que type sea del tipo NotificationType
    return this.notificationService.createSystemNotification({
      type: dto.type as NotificationType,
      title: dto.title,
      message: dto.message,
      metadata: dto.metadata,
    });
  }

  @Patch(':id/read')
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.markAsRead(id, user.id, user.role);
  }

  @Patch('read-all')
  @Roles('ADMIN', 'ANALYST', 'CUSTOMER')
  @ApiOperation({ summary: 'Marcar todas como leídas' })
  markAllAsRead(@CurrentUser() user: User): Promise<{ updated: boolean }> {
    return this.notificationService.markAllAsRead(user.id, user.role);
  }
}
