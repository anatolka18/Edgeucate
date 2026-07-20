import {
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ACTIONS } from './actions';

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
      await this.userService.online(email);
      client.join(email);

      await this.notifyOnlineStatus(email, true);
      await this.sendOnlineStatusesToUser(email);
      await this.sendUnreadNotifications(email);
    } catch (error) {
      this.disconnectWithError(client, 'Ошибка подключения');
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const email = client.data.user?.email;
    if (email) {
      await this.userService.offline(email);
      await this.notifyOnlineStatus(email, false);
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

      const plainMessage = (result as any).toObject
        ? (result as any).toObject()
        : result;

      this.server.to(data.recipient).emit('on_send_message', { ...plainMessage, unread: true });
      this.server.to(sender).emit('on_send_message', plainMessage);
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

  @SubscribeMessage(ACTIONS.JOIN)
  joinRoom(@ConnectedSocket() client: Socket, @MessageBody() config: { room: string }) {
    const { room } = config;
    const { rooms: joinedRooms } = client;

    if (Array.from(joinedRooms).includes(room)) {
      return;
    }

    const clients = Array.from(this.server.adapter.rooms.get(room) || []);

    clients.forEach(clientID => {
      this.server.to(clientID).emit(ACTIONS.ADD_PEER, {
        peerID: client.id,
        createOffer: false,
      });

      client.emit(ACTIONS.ADD_PEER, {
        peerID: clientID,
        createOffer: true,
      });
    });

    client.join(room);
    this.shareRoomsInfo();
  }

  @SubscribeMessage(ACTIONS.LEAVE)
  leaveRoom(@ConnectedSocket() client: Socket) {
    const { rooms } = client;

    Array.from(rooms)
      .filter(roomID => roomID !== client.id)
      .forEach(roomID => {
        const clients = Array.from(this.server.adapter.rooms.get(roomID) || []);

        clients.forEach(clientID => {
          this.server.to(clientID).emit(ACTIONS.REMOVE_PEER, {
            peerID: client.id,
          });

          client.emit(ACTIONS.REMOVE_PEER, {
            peerID: clientID,
          });
        });

        client.leave(roomID);
      });

    this.shareRoomsInfo();
  }

  @SubscribeMessage(ACTIONS.RELAY_SDP)
  relaySDP(@ConnectedSocket() client: Socket, @MessageBody() { peerID, sessionDescription }: { peerID: string, sessionDescription: RTCSessionDescriptionInit }) {
    this.server.to(peerID).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerID: client.id,
      sessionDescription,
    });
  }

  @SubscribeMessage(ACTIONS.RELAY_ICE)
  relayICE(@ConnectedSocket() client: Socket, @MessageBody() { peerID, iceCandidate }: { peerID: string, iceCandidate: RTCIceCandidateInit }) {
    this.server.to(peerID).emit(ACTIONS.ICE_CANDIDATE, {
      peerID: client.id,
      iceCandidate,
    });
  }

  @SubscribeMessage(ACTIONS.CREATE_ROOM)
  createRoom(@ConnectedSocket() client: Socket, @MessageBody() { roomID }: { roomID: string }) {
    client.join(roomID);
    this.shareRoomsInfo();
  }

  private shareRoomsInfo() {
    const rooms = this.getClientRooms();
    this.server.emit(ACTIONS.SHARE_ROOMS, { rooms });
  }

  private getClientRooms() {
    const allRooms = Array.from(this.server.adapter.rooms.keys());
    return allRooms.filter(roomID => {
      return roomID && typeof roomID === 'string' && roomID.startsWith('Room_');
    });
  }

  private async sendUnreadCount(recipientEmail: string, senderEmail: string) {
    const count = await this.userService.getUnreadCount(recipientEmail, senderEmail);
    this.server.to(recipientEmail).emit('unread_count', { from: senderEmail, count });
  }

  private async sendUnreadNotifications(email: string) {
      const chats = await this.userService.getChats(email);
      for (const chat of chats) {
          if (chat.unreadCount > 0) {
              this.server.to(email).emit('unread_count', { from: chat.interlocutor, count: chat.unreadCount });
          }
      }
  }

  private async notifyOnlineStatus(email: string, online: boolean) {
    const chats = await this.userService.getChats(email);
    for (const chat of chats) {
      this.server.to(chat.interlocutor).emit('user_status', { email, online });
    }
  }

  private async sendOnlineStatusesToUser(email: string) {
    const chats = await this.userService.getChats(email);
    const interlocutorEmails = chats.map(c => c.interlocutor);
    if (interlocutorEmails.length === 0) return;

    const interlocutors = await this.userService.getUsersByEmails(interlocutorEmails);
    for (const interlocutor of interlocutors) {
      this.server.to(email).emit('user_status', {
        email: interlocutor.email,
        online: interlocutor.online,
      });
    }
  }

  private disconnectWithError(client: Socket, message: string) {
    client.emit('error', { message });
    client.disconnect();
  }
}