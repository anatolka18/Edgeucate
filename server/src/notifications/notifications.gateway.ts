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

@WebSocketGateway({ namespace: 'notifications' })
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
        this.logger.warn('[CONNECT] No token, disconnecting');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
        algorithms: ['HS256'],
      });

      if (!payload.email) {
        this.logger.warn('[CONNECT] No email in payload, disconnecting');
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

      const recentNotifications = await this.notificationsService.getRecent(userEmail, 5);
      client.emit('notifications_list', recentNotifications);

      this.logger.log(`[CONNECT] User ${userEmail} connected, socketId: ${client.id}, unread: ${unreadCount}, recent: ${recentNotifications.length}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[CONNECT] Rejected: ${errorMessage}`);
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
      this.logger.log(`[DISCONNECT] ${userEmail} (${client.id})`);
    }
  }

  @SubscribeMessage('get_notifications')
  async handleGetNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { limit?: number },
  ) {
    const userEmail = (client as any).userEmail;

    if (!userEmail) {
      this.logger.warn(`[GET_NOTIFICATIONS] no userEmail, dropping`);
      return;
    }

    const limit = data?.limit || 10;
    const notifications = await this.notificationsService.getRecent(userEmail, limit);

    this.logger.debug(`[GET_NOTIFICATIONS] found ${notifications.length} for ${userEmail}`);
    client.emit('notifications_list', notifications);
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    const userEmail = (client as any).userEmail;
    if (!userEmail) return;

    await this.notificationsService.markAsRead(data.notificationId, userEmail);

    const unreadCount = await this.notificationsService.getUnreadCount(userEmail);
    this.emitToAllUserSockets(userEmail, 'unread_count', { count: unreadCount });
    client.emit('marked_read');
  }

  @SubscribeMessage('mark_all_read')
  async handleMarkAllRead(@ConnectedSocket() client: Socket) {
    const userEmail = (client as any).userEmail;
    if (!userEmail) return;

    await this.notificationsService.markAllAsRead(userEmail);
    this.emitToAllUserSockets(userEmail, 'unread_count', { count: 0 });
    client.emit('marked_all_read');
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
    this.emitToAllUserSockets(userEmail, 'unread_count', { count: unreadCount });
  }

  async broadcastToAll(notification: {
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    const payload = { ...notification, createdAt: new Date().toISOString() };
    this.server.emit('new_notification', payload);

    const activeEmails = Array.from(this.userSockets.keys());
    for (const email of activeEmails) {
      const unreadCount = await this.notificationsService.getUnreadCount(email);
      this.emitToAllUserSockets(email, 'unread_count', { count: unreadCount });
    }
  }

  private emitToAllUserSockets(userEmail: string, event: string, data: any) {
    const userSocketIds = this.userSockets.get(userEmail);
    if (!userSocketIds || userSocketIds.size === 0) return;

    for (const socketId of userSocketIds) {
      this.server.to(socketId).emit(event, data);
    }
  }
}