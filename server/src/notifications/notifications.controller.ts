import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { Role } from '../user/schemas/user.schema';
import { NotificationType } from './schemas/notification.schema';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @Post('broadcast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Массовая рассылка уведомления всем пользователям (только admin)',
    description: 'Отправляет системное уведомление всем активным пользователям. Офлайн-пользователи увидят при следующем входе.',
  })
  @ApiBody({ type: BroadcastNotificationDto })
  @ApiResponse({ status: 201, description: 'Рассылка выполнена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Нет прав (нужна роль ADMIN)' })
  async broadcast(@Body() dto: BroadcastNotificationDto) {
    const emails = await this.notificationsService.getAllEmails();

    const notifications = emails.map(email => ({
      userEmail: email,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: dto.title,
      message: dto.message,
      data: { broadcast: true, sentAt: new Date().toISOString() },
    }));

    const result = await this.notificationsService.createBulk(notifications);

    await this.notificationsGateway.broadcastToAll({
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: dto.title,
      message: dto.message,
      data: { broadcast: true },
    });

    return {
      success: true,
      recipientsCount: result.insertedCount,
    };
  }
}