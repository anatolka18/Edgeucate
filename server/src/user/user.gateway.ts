import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'users',
})
export class UserSocketService implements OnGatewayConnection, OnGatewayDisconnect {
  private typingUsers: Map<string, Set<string>> = new Map();

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  @WebSocketServer()
  server: Namespace;

  handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        client.emit('error', { message: 'Токен не предоставлен' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.data.user = payload;
      this.userService.online(payload.email);
      client.join(payload.email);
      this.notifyOnlineStatus(payload.email, true);
      this.sendUnreadNotifications(payload.email);
    } catch (error) {
      client.emit('error', { message: 'Недействительный токен' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const email = client.data.user?.email;
    if (email) {
      this.userService.offline(email);
      this.notifyOnlineStatus(email, false);
      this.clearTypingStatus(email);
    }
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { recipient: string; message: string },
  ) {
    try {
      const sender = client.data.user.email;

      if (!data.message || data.message.trim().length === 0) {
        client.emit('error', { message: 'Сообщение не может быть пустым' });
        return;
      }

      if (data.message.length > 2000) {
        client.emit('error', { message: 'Сообщение слишком длинное' });
        return;
      }

      if (!data.recipient) {
        client.emit('error', { message: 'Получатель не указан' });
        return;
      }

      if (sender === data.recipient) {
        client.emit('error', { message: 'Нельзя отправить сообщение самому себе' });
        return;
      }

      const result = await this.userService.sendMessage({
        sender,
        recipient: data.recipient,
        message: data.message,
      });

      const messageWithUnread = {
        ...result,
        unread: true,
      };

      this.server.to(data.recipient).emit('on_send_message', messageWithUnread);
      this.server.to(sender).emit('on_send_message', result);

      this.sendUnreadCount(data.recipient, sender);
    } catch (error) {
      client.emit('error', { message: 'Ошибка при отправке сообщения' });
    }
  }

  @SubscribeMessage('read_messages')
  async readMessages(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { from: string },
  ) {
    try {
      const reader = client.data.user.email;
      await this.userService.markMessagesAsRead(reader, data.from);
      this.sendUnreadCount(reader, data.from);
    } catch (error) {
      client.emit('error', { message: 'Ошибка при отметке сообщений' });
    }
  }

  @SubscribeMessage('typing_start')
  async typingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { recipient: string },
  ) {
    const sender = client.data.user.email;
    if (!this.typingUsers.has(data.recipient)) {
      this.typingUsers.set(data.recipient, new Set());
    }
    this.typingUsers.get(data.recipient).add(sender);
    this.server.to(data.recipient).emit('typing', { user: sender, typing: true });
  }

  @SubscribeMessage('typing_end')
  async typingEnd(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { recipient: string },
  ) {
    const sender = client.data.user.email;
    const typists = this.typingUsers.get(data.recipient);
    if (typists) {
      typists.delete(sender);
      if (typists.size === 0) {
        this.typingUsers.delete(data.recipient);
      }
    }
    this.server.to(data.recipient).emit('typing', { user: sender, typing: false });
  }

  private async notifyOnlineStatus(email: string, online: boolean) {
    const chats = await this.userService.getChats(email);
    for (const chat of chats) {
      this.server.to(chat.interlocutor).emit('user_status', { email, online });
    }
  }

  private async sendUnreadNotifications(email: string) {
    const chats = await this.userService.getChats(email);
    for (const chat of chats) {
      const unreadCount = chat.messages.filter((m) => m.sender !== email && !m.checked).length;
      if (unreadCount > 0) {
        this.server.to(email).emit('unread_count', {
          from: chat.interlocutor,
          count: unreadCount,
        });
      }
    }
  }

  private async sendUnreadCount(recipientEmail: string, senderEmail: string) {
    const chats = await this.userService.getChats(recipientEmail);
    const chat = chats.find((c) => c.interlocutor === senderEmail);
    if (chat) {
      const unreadCount = chat.messages.filter((m) => m.sender === senderEmail && !m.checked).length;
      this.server.to(recipientEmail).emit('unread_count', {
        from: senderEmail,
        count: unreadCount,
      });
    }
  }

  private clearTypingStatus(email: string) {
    this.typingUsers.forEach((typists, recipient) => {
      if (typists.has(email)) {
        typists.delete(email);
        this.server.to(recipient).emit('typing', { user: email, typing: false });
      }
    });
  }
}