import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './schemas/notification.schema';

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
        algorithms: ['HS256'],
      });

      if (!payload.email) {
        client.disconnect();
        return;
      }

      const userEmail = payload.email;
      (client as any).userEmail = userEmail;

      if (!this.userSockets.has(userEmail)) {
        this.userSockets.set(userEmail, new Set());
      }
      this.userSockets.get(userEmail).add(client.id);

      const unreadCount = await this.notificationsService.getUnreadCount(userEmail);
      client.emit('unread_count', { count: unreadCount });

      this.logger.debug(`User connected: ${userEmail} (${client.id})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Connection rejected: ${errorMessage}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userEmail = (client as any).userEmail;

    if (userEmail && this.userSockets.has(userEmail)) {
      this.userSockets.get(userEmail).delete(client.id);
      if (this.userSockets.get(userEmail).size === 0) {
        this.userSockets.delete(userEmail);
      }
      this.logger.debug(`User disconnected: ${userEmail} (${client.id})`);
    }
  }

  @SubscribeMessage('get_notifications')
  async handleGetNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { limit?: number },
  ) {
    const userEmail = (client as any).userEmail;

    if (!userEmail) {
      return { error: 'Unauthorized' };
    }

    const limit = data?.limit || 10;
    const notifications = await this.notificationsService.getRecent(userEmail, limit);

    return { notifications };
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    const userEmail = (client as any).userEmail;

    if (!userEmail) {
      return { error: 'Unauthorized' };
    }

    await this.notificationsService.markAsRead(data.notificationId, userEmail);

    const unreadCount = await this.notificationsService.getUnreadCount(userEmail);
    client.emit('unread_count', { count: unreadCount });

    return { success: true };
  }

  @SubscribeMessage('mark_all_read')
  async handleMarkAllRead(@ConnectedSocket() client: Socket) {
    const userEmail = (client as any).userEmail;

    if (!userEmail) {
      return { error: 'Unauthorized' };
    }

    await this.notificationsService.markAllAsRead(userEmail);
    client.emit('unread_count', { count: 0 });

    return { success: true };
  }

  async sendToUser(userEmail: string, notification: {
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    const userSocketIds = this.userSockets.get(userEmail);

    if (!userSocketIds || userSocketIds.size === 0) {
      return;
    }

    for (const socketId of userSocketIds) {
      this.server.to(socketId).emit('new_notification', notification);
    }

    const unreadCount = await this.notificationsService.getUnreadCount(userEmail);

    for (const socketId of userSocketIds) {
      this.server.to(socketId).emit('unread_count', { count: unreadCount });
    }
  }
    async broadcastToAll(notification: {
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    const payload = { ...notification, _id: 'broadcast', createdAt: new Date() };
    this.server.emit('new_notification', payload);

    const activeEmails = Array.from(this.userSockets.keys());
    for (const email of activeEmails) {
      const userSocketIds = this.userSockets.get(email);
      if (userSocketIds && userSocketIds.size > 0) {
        const unreadCount = await this.notificationsService.getUnreadCount(email);
        for (const socketId of userSocketIds) {
          this.server.to(socketId).emit('unread_count', { count: unreadCount });
        }
      }
    }
  }
}