import {
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
import { UserService } from './user.service';
import { PresenceService } from './presence.service';
import { MessageService } from '../message/message.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ACTIONS } from './actions';
import { sanitizeHtml } from '../common/utils/sanitize';
import { APP_CONFIG } from '../common/config/app.config';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: { id: string; email: string; role: string };
  };
}

@WebSocketGateway({ namespace: 'users' })
export class UserSocketService implements OnGatewayConnection, OnGatewayDisconnect {
  private typingUsers = new Map<string, Set<string>>();
  private lastMessageTimes = new Map<string, number>();
  
  private connectionCounts = new Map<string, { count: number; resetAt: number }>();
  private readonly MAX_CONNECTIONS_PER_IP = 5;
  private readonly CONNECTION_WINDOW_MS = 60000;
  
  private eventCounts = new Map<string, { count: number; resetAt: number }>();
  private readonly MAX_EVENTS_PER_SECOND = 20;

  private userSockets = new Map<string, Set<string>>();
  private socketRooms = new Map<string, Set<string>>();

  constructor(
    private userService: UserService,
    private presenceService: PresenceService,
    private messageService: MessageService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  @WebSocketServer() server: Namespace;

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const ip = client.handshake.address;
      const now = Date.now();
      
      const record = this.connectionCounts.get(ip);
      if (!record || now > record.resetAt) {
        this.connectionCounts.set(ip, { count: 1, resetAt: now + this.CONNECTION_WINDOW_MS });
      } else {
        if (record.count >= this.MAX_CONNECTIONS_PER_IP) {
          return this.disconnectWithError(client, 'Слишком много подключений');
        }
        record.count++;
      }

      const token = client.handshake.auth.token;
      if (!token) {
        return this.disconnectWithError(client, 'Токен не предоставлен');
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const email = payload.email;

      client.data.user = payload;

      if (!this.userSockets.has(email)) {
        this.userSockets.set(email, new Set());
      }
      this.userSockets.get(email).add(client.id);
      this.socketRooms.set(client.id, new Set());

      await this.presenceService.online(email);
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
    const ip = client.handshake.address;
    
    const record = this.connectionCounts.get(ip);
    if (record && record.count > 0) {
      record.count--;
    }

    this.cleanupClientFromRooms(client);
    
    if (email) {
      const sockets = this.userSockets.get(email);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(email);
          await this.presenceService.offline(email);
          await this.notifyOnlineStatus(email, false);
        }
      }

      this.clearTypingStatus(email);
    }

    this.socketRooms.delete(client.id);
  }

  private cleanupClientFromRooms(client: AuthenticatedSocket) {
    const rooms = this.socketRooms.get(client.id);
    if (!rooms) return;

    rooms.forEach(roomID => {
      const clientsInRoom = Array.from(this.server.adapter.rooms.get(roomID) || []);
      
      clientsInRoom.forEach(otherClientID => {
        if (otherClientID !== client.id) {
          this.server.to(otherClientID).emit(ACTIONS.REMOVE_PEER, {
            peerID: client.id,
          });
        }
      });

      try {
        client.leave(roomID);
      } catch (e) {}
    });

    rooms.clear();
  }

  private checkRateLimit(key: string, maxCount: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.eventCounts.get(key);
    
    if (!record || now > record.resetAt) {
      this.eventCounts.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    
    if (record.count >= maxCount) {
      return false;
    }
    
    record.count++;
    return true;
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { recipient: string; message: string },
  ) {
    try {
      const sender = client.data.user?.email;
      if (!sender) return client.emit('error', { message: 'Ошибка аутентификации' });

      const now = Date.now();
      const lastTime = this.lastMessageTimes.get(sender);
      if (lastTime && now - lastTime < APP_CONFIG.MESSAGE.THROTTLE_MS) {
        return client.emit('error', { message: 'Слишком часто. Подождите немного.' });
      }
      this.lastMessageTimes.set(sender, now);

      const cleanMessage = sanitizeHtml(data.message?.trim() || '');
      if (!cleanMessage) return client.emit('error', { message: 'Сообщение пустое' });
      if (cleanMessage.length > APP_CONFIG.MESSAGE.MAX_LENGTH) return client.emit('error', { message: 'Слишком длинное' });
      if (!data.recipient) return client.emit('error', { message: 'Получатель не указан' });
      if (sender === data.recipient) return client.emit('error', { message: 'Нельзя отправить себе' });

      const result = await this.messageService.sendMessage({
        sender,
        recipient: data.recipient,
        message: cleanMessage,
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
      await this.messageService.markMessagesAsRead(client.data.user.email, data.from);
      this.sendUnreadCount(client.data.user.email, data.from);
    } catch (error) {
      client.emit('error', { message: 'Ошибка отметки прочтения' });
    }
  }

  @SubscribeMessage('edit_message')
  async editMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; message: string },
  ) {
    try {
      const sender = client.data.user?.email;
      if (!sender) return;
      const cleanMessage = sanitizeHtml(data.message.trim());
      if (!cleanMessage) return;
      const updated = await this.messageService.editMessage(data.messageId, sender, cleanMessage);
      this.server.to(updated.sender).emit('message_edited', updated);
      this.server.to(updated.recipient).emit('message_edited', updated);
    } catch (error) {
      client.emit('error', { message: 'Ошибка редактирования' });
    }
  }

  @SubscribeMessage('delete_message')
  async deleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const sender = client.data.user?.email;
      if (!sender) return;
      const updated = await this.messageService.deleteMessage(data.messageId, sender);
      this.server.to(updated.sender).emit('message_deleted', updated);
      this.server.to(updated.recipient).emit('message_deleted', updated);
    } catch (error) {
      client.emit('error', { message: 'Ошибка удаления' });
    }
  }

  @SubscribeMessage('typing_start')
  async typingStart(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { recipient: string }) {
    const sender = client.data.user.email;
    
    if (!this.checkRateLimit(`typing:${sender}`, 10, 1000)) {
      return;
    }
    
    if (!this.typingUsers.has(data.recipient)) this.typingUsers.set(data.recipient, new Set());
    this.typingUsers.get(data.recipient).add(sender);
    this.server.to(data.recipient).emit('typing', { user: sender, typing: true });
  }

  @SubscribeMessage('typing_end')
  async typingEnd(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { recipient: string }) {
    const sender = client.data.user.email;
    
    if (!this.checkRateLimit(`typing:${sender}`, 10, 1000)) {
      return;
    }
    
    const typists = this.typingUsers.get(data.recipient);
    if (typists) {
      typists.delete(sender);
      if (typists.size === 0) this.typingUsers.delete(data.recipient);
    }
    this.server.to(data.recipient).emit('typing', { user: sender, typing: false });
  }

  @SubscribeMessage(ACTIONS.JOIN)
  joinRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() config: { room: string }) {
    const { room } = config;

    if (!client.data?.user) {
      return client.emit('error', { message: 'Необходима авторизация' });
    }

    if (!this.checkRateLimit(`webrtc:${client.id}`, 10, 1000)) {
      return client.emit('error', { message: 'Слишком много запросов' });
    }

    const userEmail = client.data.user.email;

    const oldSockets = this.userSockets.get(userEmail);
    if (oldSockets) {
      oldSockets.forEach(oldSocketID => {
        if (oldSocketID !== client.id) {
          const oldSocket = this.server.sockets.get(oldSocketID);
          if (oldSocket) {
            const oldRooms = this.socketRooms.get(oldSocketID);
            if (oldRooms && oldRooms.has(room)) {
              this.server.to(client.id).emit(ACTIONS.REMOVE_PEER, {
                peerID: oldSocketID,
              });

              const clientsInRoom = Array.from(this.server.adapter.rooms.get(room) || []);
              clientsInRoom.forEach(otherID => {
                if (otherID !== oldSocketID && otherID !== client.id) {
                  this.server.to(otherID).emit(ACTIONS.REMOVE_PEER, {
                    peerID: oldSocketID,
                  });
                }
              });

              try {
                oldSocket.leave(room);
              } catch (e) {}
              oldRooms.delete(room);
            }
          }
        }
      });
    }

    const rooms = this.socketRooms.get(client.id);
    if (rooms && rooms.has(room)) {
      return;
    }

    const clients = Array.from(this.server.adapter.rooms.get(room) || []);

    clients.forEach(clientID => {
      if (clientID === client.id) return;
      this.server.to(clientID).emit(ACTIONS.ADD_PEER, {
        peerID: client.id,
        email: userEmail,
        createOffer: false,
      });

      client.emit(ACTIONS.ADD_PEER, {
        peerID: clientID,
        email: userEmail,
        createOffer: true,
      });
    });

    client.join(room);
    if (rooms) {
      rooms.add(room);
    }
    this.shareRoomsInfo();
  }

  @SubscribeMessage(ACTIONS.LEAVE)
  leaveRoom(@ConnectedSocket() client: AuthenticatedSocket) {
    const rooms = this.socketRooms.get(client.id);
    if (!rooms) return;

    const roomsToLeave = Array.from(rooms);

    roomsToLeave.forEach(roomID => {
      const clientsInRoom = Array.from(this.server.adapter.rooms.get(roomID) || []);

      clientsInRoom.forEach(otherClientID => {
        if (otherClientID !== client.id) {
          this.server.to(otherClientID).emit(ACTIONS.REMOVE_PEER, {
            peerID: client.id,
          });
        }
      });

      try {
        client.leave(roomID);
      } catch (e) {}
    });

    rooms.clear();
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
    const count = await this.messageService.getUnreadCount(recipientEmail, senderEmail);
    this.server.to(recipientEmail).emit('unread_count', { from: senderEmail, count });
  }

  private async sendUnreadNotifications(email: string) {
    const chats = await this.messageService.getChats(email);
    for (const chat of chats) {
      if (chat.unreadCount > 0) {
        this.server.to(email).emit('unread_count', { from: chat.interlocutor, count: chat.unreadCount });
      }
    }
  }

  private async notifyOnlineStatus(email: string, online: boolean) {
    const chats = await this.messageService.getChats(email);
    for (const chat of chats) {
      this.server.to(chat.interlocutor).emit('user_status', { email, online });
    }
  }

  private async sendOnlineStatusesToUser(email: string) {
    const chats = await this.messageService.getChats(email);
    const interlocutorEmails = chats.map(c => c.interlocutor);
    if (interlocutorEmails.length === 0) return;

    const interlocutors = await this.presenceService.getUsersByEmails(interlocutorEmails);
    for (const interlocutor of interlocutors) {
      this.server.to(email).emit('user_status', {
        email: interlocutor.email,
        online: interlocutor.online,
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

  private disconnectWithError(client: Socket, message: string) {
    client.emit('error', { message });
    client.disconnect();
  }
}