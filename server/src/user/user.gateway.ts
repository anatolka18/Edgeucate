import {
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: { id: string; email: string; role: string };
  };
}

@WebSocketGateway({ cors: { origin: '*', credentials: true }, namespace: 'users' })
export class UserSocketService implements OnGatewayConnection, OnGatewayDisconnect {
  private typingUsers = new Map<string, Set<string>>();

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  @WebSocketServer() server: Namespace;

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        return this.disconnectWithError(client, 'Токен не предоставлен');
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const email = payload.email;

      client.data.user = payload;
      // await this.userService.online(email);
      client.join(email);

      // Отправляем начальные уведомления о непрочитанных
      await this.sendUnreadNotifications(email);
    } catch (error) {
      this.disconnectWithError(client, 'Ошибка подключения');
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const email = client.data.user?.email;
    if (email) {
      // await this.userService.offline(email);
      // this.clearTypingStatus(email);
    }
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { recipient: string; message: string },
  ) {
    try {
      const sender = client.data.user?.email;
      if (!sender) return client.emit('error', { message: 'Ошибка аутентификации' });
      if (!data.message?.trim()) return client.emit('error', { message: 'Сообщение пустое' });
      if (data.message.length > 2000) return client.emit('error', { message: 'Слишком длинное' });
      if (!data.recipient) return client.emit('error', { message: 'Получатель не указан' });
      if (sender === data.recipient) return client.emit('error', { message: 'Нельзя отправить себе' });

      const result = await this.userService.sendMessage({
        sender,
        recipient: data.recipient,
        message: data.message,
      });

      this.server.to(data.recipient).emit('on_send_message', { ...result, unread: true });
      this.server.to(sender).emit('on_send_message', result);

      this.sendUnreadCount(data.recipient, sender);
    } catch (error) {
      client.emit('error', { message: 'Ошибка отправки сообщения' });
    }
  }

  @SubscribeMessage('read_messages')
  async readMessages(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { from: string }) {
    try {
      await this.userService.markMessagesAsRead(client.data.user.email, data.from);
      this.sendUnreadCount(client.data.user.email, data.from);
    } catch (error) {
      client.emit('error', { message: 'Ошибка отметки прочтения' });
    }
  }

  // @SubscribeMessage('typing_start')
  // async typingStart(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { recipient: string }) {
  //   const sender = client.data.user.email;
  //   if (!this.typingUsers.has(data.recipient)) this.typingUsers.set(data.recipient, new Set());
  //   this.typingUsers.get(data.recipient).add(sender);
  //   this.server.to(data.recipient).emit('typing', { user: sender, typing: true });
  // }

  // @SubscribeMessage('typing_end')
  // async typingEnd(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { recipient: string }) {
  //   const sender = client.data.user.email;
  //   const typists = this.typingUsers.get(data.recipient);
  //   if (typists) {
  //     typists.delete(sender);
  //     if (typists.size === 0) this.typingUsers.delete(data.recipient);
  //   }
  //   this.server.to(data.recipient).emit('typing', { user: sender, typing: false });
  // }

  private async sendUnreadCount(recipientEmail: string, senderEmail: string) {
    const chats = await this.userService.getChats(recipientEmail);
    const chat = chats.find(c => c.interlocutor === senderEmail);
    if (chat) {
      const unread = chat.messages.filter(m => m.sender === senderEmail && !m.checked).length;
      this.server.to(recipientEmail).emit('unread_count', { from: senderEmail, count: unread });
    }
  }

  private async sendUnreadNotifications(email: string) {
    const chats = await this.userService.getChats(email);
    for (const chat of chats) {
      const unread = chat.messages.filter(m => m.sender !== email && !m.checked).length;
      if (unread > 0) {
        this.server.to(email).emit('unread_count', { from: chat.interlocutor, count: unread });
      }
    }
  }

  // private clearTypingStatus(email: string) {
  //   this.typingUsers.forEach((typists, recipient) => {
  //     if (typists.has(email)) {
  //       typists.delete(email);
  //       this.server.to(recipient).emit('typing', { user: email, typing: false });
  //     }
  //   });
  // }

  private disconnectWithError(client: Socket, message: string) {
    client.emit('error', { message });
    client.disconnect();
  }
}