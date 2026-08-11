import {
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
import { Logger } from '@nestjs/common';
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
    user?: { id: string; email: string; role: string; username?: string };
  };
}

interface PeerInfo {
  peerID: string;
  email: string;
  username?: string;
}

@WebSocketGateway({ namespace: 'users' })
export class UserSocketService implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(UserSocketService.name);

  private typingUsers = new Map<string, Set<string>>();
  private lastMessageTimes = new Map<string, number>();

  private connectionCounts = new Map<string, { count: number; resetAt: number }>();
  private readonly MAX_CONNECTIONS_PER_IP = 5;
  private readonly CONNECTION_WINDOW_MS = 60000;

  private eventCounts = new Map<string, { count: number; resetAt: number }>();

  private userSockets = new Map<string, Set<string>>();
  private socketRooms = new Map<string, Set<string>>();
  private socketUsers = new Map<string, { email: string; username?: string }>();
  private roomDeletionTimers = new Map<string, NodeJS.Timeout>();
  private roomCreators = new Map<string, string>();

  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private userService: UserService,
    private presenceService: PresenceService,
    private messageService: MessageService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.startPeriodicCleanup();
  }

  @WebSocketServer() server: Namespace;

  private startPeriodicCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      for (const [key, record] of this.eventCounts.entries()) {
        if (now > record.resetAt) {
          this.eventCounts.delete(key);
        }
      }

      for (const [email, lastTime] of this.lastMessageTimes.entries()) {
        if (now - lastTime > APP_CONFIG.MESSAGE.THROTTLE_MS * 2) {
          this.lastMessageTimes.delete(email);
        }
      }

      for (const [recipient, typists] of this.typingUsers.entries()) {
        if (typists.size === 0) {
          this.typingUsers.delete(recipient);
        }
      }
    }, 60000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    for (const timer of this.roomDeletionTimers.values()) {
      clearTimeout(timer);
    }
    this.roomDeletionTimers.clear();
  }

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
        algorithms: ['HS256'],
      });
      const email = payload.email;

      if (!email) {
        return this.disconnectWithError(client, 'Неверный токен');
      }

      client.data.user = payload;

      let username: string | undefined;
      try {
        const user = await this.userService.findByEmail(email);
        username = user?.username;
      } catch (e) {
        this.logger.warn(`[CONNECT] Failed to fetch username for ${email}`);
      }

      this.socketUsers.set(client.id, { email, username });

      if (!this.userSockets.has(email)) {
        this.userSockets.set(email, new Set());
      }
      this.userSockets.get(email)!.add(client.id);
      this.socketRooms.set(client.id, new Set());

      await this.presenceService.online(email);
      client.join(email);

      await this.notifyOnlineStatus(email, true);
      await this.sendOnlineStatusesToUser(email);
      await this.sendUnreadNotifications(email);

      this.shareRoomsInfoToClient(client);

      this.logger.debug(`[CONNECT] ${email} (${client.id})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[CONNECT] Error: ${errorMessage}`);
      this.disconnectWithError(client, 'Ошибка подключения');
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const email = client.data.user?.email;
    const ip = client.handshake.address;

    this.logger.debug(`[DISCONNECT] ${email || 'unknown'} (${client.id})`);

    const record = this.connectionCounts.get(ip);
    if (record && record.count > 0) {
      record.count--;
    }

    this.cleanupClientFromRooms(client);
    this.socketUsers.delete(client.id);

    if (email) {
      const sockets = this.userSockets.get(email);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(email);
          try {
            await this.presenceService.offline(email);
            await this.notifyOnlineStatus(email, false);
          } catch (e) {
            this.logger.error(`[DISCONNECT] Failed to update presence: ${e instanceof Error ? e.message : e}`);
          }
        }
      }

      this.clearTypingStatus(email);
    }

    this.socketRooms.delete(client.id);
  }

  private cleanupClientFromRooms(client: AuthenticatedSocket) {
    const rooms = this.socketRooms.get(client.id);
    if (!rooms || rooms.size === 0) return;

    const userInfo = this.socketUsers.get(client.id);
    const peerID = userInfo?.email || client.id;

    const roomsArray = Array.from(rooms);

    roomsArray.forEach(roomID => {
      const clientsInRoom = Array.from(this.server.adapter.rooms.get(roomID) || []);

      clientsInRoom.forEach(otherClientID => {
        if (otherClientID !== client.id) {
          this.server.to(otherClientID).emit(ACTIONS.REMOVE_PEER, {
            peerID,
          });
        }
      });

      try {
        client.leave(roomID);
      } catch (e) {
        this.logger.warn(`[CLEANUP] Failed to leave room ${roomID}: ${e}`);
      }

      this.checkAndScheduleRoomDeletion(roomID, userInfo?.email);
    });

    rooms.clear();
  }

  private checkAndScheduleRoomDeletion(roomID: string, email?: string) {
    const creatorEmail = this.roomCreators.get(roomID);
    if (!creatorEmail || creatorEmail !== email) return;

    const clientsInRoom = Array.from(this.server.adapter.rooms.get(roomID) || []);
    if (clientsInRoom.length > 0) return;

    if (this.roomDeletionTimers.has(roomID)) {
      clearTimeout(this.roomDeletionTimers.get(roomID)!);
    }

    this.logger.debug(`[ROOM] Scheduling deletion for ${roomID} in 10s (creator ${email} left)`);

    const timer = setTimeout(() => {
      const currentClients = Array.from(this.server.adapter.rooms.get(roomID) || []);
      if (currentClients.length === 0) {
        this.roomCreators.delete(roomID);
        this.server.emit(ACTIONS.ROOM_DELETED, { roomID });
        this.logger.log(`[ROOM] Deleted empty room ${roomID}`);
      } else {
        this.logger.debug(`[ROOM] Room ${roomID} still has ${currentClients.length} clients, keeping`);
      }
      this.roomDeletionTimers.delete(roomID);
    }, 10000);

    this.roomDeletionTimers.set(roomID, timer);
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

  private isValidRoom(room: unknown): room is string {
    return typeof room === 'string'
      && room.length > 0
      && room.length <= 100
      && room.startsWith('Room_');
  }

  private hasCommonRoom(senderSocketId: string, targetSocketId: string): boolean {
    const senderRooms = this.socketRooms.get(senderSocketId);
    const targetRooms = this.socketRooms.get(targetSocketId);
    if (!senderRooms || !targetRooms) return false;

    for (const room of senderRooms) {
      if (targetRooms.has(room)) return true;
    }
    return false;
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { recipient: string; message: string },
  ) {
    try {
      const sender = client.data.user?.email;
      if (!sender) return client.emit('error', { message: 'Ошибка аутентификации' });

      if (!data.recipient || typeof data.recipient !== 'string') {
        return client.emit('error', { message: 'Получатель не указан' });
      }

      if (sender === data.recipient) {
        return client.emit('error', { message: 'Нельзя отправить себе' });
      }

      if (!this.checkRateLimit(`send_message:${sender}`, 10, 1000)) {
        return client.emit('error', { message: 'Слишком много запросов' });
      }

      const now = Date.now();
      const lastTime = this.lastMessageTimes.get(sender);
      if (lastTime && now - lastTime < APP_CONFIG.MESSAGE.THROTTLE_MS) {
        return client.emit('error', { message: 'Слишком часто. Подождите немного.' });
      }

      const cleanMessage = sanitizeHtml(data.message?.trim() || '');
      if (!cleanMessage) return client.emit('error', { message: 'Сообщение пустое' });
      if (cleanMessage.length > APP_CONFIG.MESSAGE.MAX_LENGTH) {
        return client.emit('error', { message: 'Слишком длинное' });
      }

      this.lastMessageTimes.set(sender, now);

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
      this.logger.error(`[SEND_MESSAGE] Error: ${error instanceof Error ? error.message : error}`);
      client.emit('error', { message: 'Ошибка отправки сообщения' });
    }
  }

  @SubscribeMessage('read_messages')
  async readMessages(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { from: string }) {
    try {
      if (!data.from || typeof data.from !== 'string') {
        return client.emit('error', { message: 'Неверный формат' });
      }
      await this.messageService.markMessagesAsRead(client.data.user.email, data.from);
      this.sendUnreadCount(client.data.user.email, data.from);
    } catch (error) {
      this.logger.error(`[READ_MESSAGES] Error: ${error instanceof Error ? error.message : error}`);
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
      if (!data.messageId || typeof data.messageId !== 'string') return;

      const cleanMessage = sanitizeHtml(data.message?.trim() || '');
      if (!cleanMessage) return;

      const updated = await this.messageService.editMessage(data.messageId, sender, cleanMessage);
      this.server.to(updated.sender).emit('message_edited', updated);
      this.server.to(updated.recipient).emit('message_edited', updated);
    } catch (error) {
      this.logger.error(`[EDIT_MESSAGE] Error: ${error instanceof Error ? error.message : error}`);
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
      if (!data.messageId || typeof data.messageId !== 'string') return;

      const updated = await this.messageService.deleteMessage(data.messageId, sender);
      this.server.to(updated.sender).emit('message_deleted', updated);
      this.server.to(updated.recipient).emit('message_deleted', updated);
    } catch (error) {
      this.logger.error(`[DELETE_MESSAGE] Error: ${error instanceof Error ? error.message : error}`);
      client.emit('error', { message: 'Ошибка удаления' });
    }
  }

  @SubscribeMessage('typing_start')
  async typingStart(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { recipient: string }) {
    const sender = client.data.user?.email;
    if (!sender || !data.recipient) return;

    if (!this.checkRateLimit(`typing:${sender}`, 10, 1000)) {
      return;
    }

    if (!this.typingUsers.has(data.recipient)) this.typingUsers.set(data.recipient, new Set());
    this.typingUsers.get(data.recipient)!.add(sender);
    this.server.to(data.recipient).emit('typing', { user: sender, typing: true });
  }

  @SubscribeMessage('typing_end')
  async typingEnd(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { recipient: string }) {
    const sender = client.data.user?.email;
    if (!sender || !data.recipient) return;

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

    if (!this.isValidRoom(room)) {
      return client.emit('error', { message: 'Неверный ID комнаты' });
    }

    const userEmail = client.data.user.email;
    if (!this.checkRateLimit(`webrtc:${userEmail}`, 10, 1000)) {
      return client.emit('error', { message: 'Слишком много запросов' });
    }

    const userInfo = this.socketUsers.get(client.id) || { email: userEmail };

    if (this.roomDeletionTimers.has(room)) {
      clearTimeout(this.roomDeletionTimers.get(room)!);
      this.roomDeletionTimers.delete(room);
      this.logger.debug(`[ROOM] Cancelled deletion timer for ${room}`);
    }

    const oldSockets = this.userSockets.get(userEmail);
    if (oldSockets) {
      oldSockets.forEach(oldSocketID => {
        if (oldSocketID !== client.id) {
          const oldSocket = this.server.sockets.get(oldSocketID);
          if (oldSocket) {
            const oldRooms = this.socketRooms.get(oldSocketID);
            if (oldRooms && oldRooms.has(room)) {
              const oldUserInfo = this.socketUsers.get(oldSocketID) || { email: userEmail };

              this.server.to(client.id).emit(ACTIONS.REMOVE_PEER, {
                peerID: oldUserInfo.email,
              });

              const clientsInRoom = Array.from(this.server.adapter.rooms.get(room) || []);
              clientsInRoom.forEach(otherID => {
                if (otherID !== oldSocketID && otherID !== client.id) {
                  this.server.to(otherID).emit(ACTIONS.REMOVE_PEER, {
                    peerID: oldUserInfo.email,
                  });
                }
              });

              try {
                oldSocket.leave(room);
              } catch (e) {
                this.logger.warn(`[JOIN] Failed old socket leave: ${e}`);
              }
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

    const existingPeers: PeerInfo[] = [];
    clients.forEach(clientID => {
      if (clientID === client.id) return;
      const peerInfo = this.socketUsers.get(clientID);
      if (peerInfo) {
        existingPeers.push({
          peerID: peerInfo.email,
          email: peerInfo.email,
          username: peerInfo.username,
        });
      }
    });

    client.emit(ACTIONS.ALL_PEERS, { peers: existingPeers });

    clients.forEach(clientID => {
      if (clientID === client.id) return;
      this.server.to(clientID).emit(ACTIONS.ADD_PEER, {
        peerID: userEmail,
        email: userEmail,
        username: userInfo.username,
        createOffer: false,
      });

      const peerInfo = this.socketUsers.get(clientID);
      client.emit(ACTIONS.ADD_PEER, {
        peerID: peerInfo?.email || clientID,
        email: peerInfo?.email || clientID,
        username: peerInfo?.username,
        createOffer: true,
      });
    });

    client.join(room);
    if (rooms) {
      rooms.add(room);
    }
    this.shareRoomsInfoToClient(client);

    this.logger.debug(`[JOIN] ${userEmail} joined ${room} (peers: ${existingPeers.length})`);
  }

  @SubscribeMessage(ACTIONS.LEAVE)
  leaveRoom(@ConnectedSocket() client: AuthenticatedSocket) {
    const rooms = this.socketRooms.get(client.id);
    if (!rooms || rooms.size === 0) return;

    const userInfo = this.socketUsers.get(client.id);
    const peerID = userInfo?.email || client.id;
    const userEmail = userInfo?.email;

    const roomsToLeave = Array.from(rooms);

    roomsToLeave.forEach(roomID => {
      const clientsInRoom = Array.from(this.server.adapter.rooms.get(roomID) || []);

      clientsInRoom.forEach(otherClientID => {
        if (otherClientID !== client.id) {
          this.server.to(otherClientID).emit(ACTIONS.REMOVE_PEER, {
            peerID,
          });
        }
      });

      try {
        client.leave(roomID);
      } catch (e) {
        this.logger.warn(`[LEAVE] Failed to leave ${roomID}: ${e}`);
      }

      this.checkAndScheduleRoomDeletion(roomID, userEmail);
    });

    rooms.clear();
    this.shareRoomsInfoToClient(client);

    this.logger.debug(`[LEAVE] ${userEmail} left ${roomsToLeave.length} rooms`);
  }

  @SubscribeMessage(ACTIONS.RELAY_SDP)
  relaySDP(
    @ConnectedSocket() client: Socket,
    @MessageBody() { peerID, sessionDescription }: { peerID: string; sessionDescription: RTCSessionDescriptionInit }
  ) {
    const senderInfo = this.socketUsers.get(client.id);
    if (!senderInfo) {
      this.logger.debug(`[RELAY_SDP] Unknown sender ${client.id}`);
      return;
    }

    if (!peerID || typeof peerID !== 'string') {
      this.logger.debug(`[RELAY_SDP] Invalid peerID`);
      return;
    }

    if (!this.checkRateLimit(`relay:${client.id}`, 50, 1000)) {
      return;
    }

    const senderEmail = senderInfo.email;

    const targetSockets = this.userSockets.get(peerID);
    if (!targetSockets || targetSockets.size === 0) {
      this.logger.debug(`[RELAY_SDP] Target ${peerID} not found, dropping SDP`);
      return;
    }

    targetSockets.forEach(socketID => {
      if (this.hasCommonRoom(client.id, socketID)) {
        this.server.to(socketID).emit(ACTIONS.SESSION_DESCRIPTION, {
          peerID: senderEmail,
          sessionDescription,
        });
      }
    });
  }

  @SubscribeMessage(ACTIONS.RELAY_ICE)
  relayICE(
    @ConnectedSocket() client: Socket,
    @MessageBody() { peerID, iceCandidate }: { peerID: string; iceCandidate: RTCIceCandidateInit }
  ) {
    const senderInfo = this.socketUsers.get(client.id);
    if (!senderInfo) {
      this.logger.debug(`[RELAY_ICE] Unknown sender ${client.id}`);
      return;
    }

    if (!peerID || typeof peerID !== 'string') {
      this.logger.debug(`[RELAY_ICE] Invalid peerID`);
      return;
    }

    if (!this.checkRateLimit(`relay:${client.id}`, 50, 1000)) {
      return;
    }

    const senderEmail = senderInfo.email;

    const targetSockets = this.userSockets.get(peerID);
    if (!targetSockets || targetSockets.size === 0) {
      this.logger.debug(`[RELAY_ICE] Target ${peerID} not found, dropping ICE candidate`);
      return;
    }

    targetSockets.forEach(socketID => {
      if (this.hasCommonRoom(client.id, socketID)) {
        this.server.to(socketID).emit(ACTIONS.ICE_CANDIDATE, {
          peerID: senderEmail,
          iceCandidate,
        });
      }
    });
  }

  @SubscribeMessage(ACTIONS.CREATE_ROOM)
  createRoom(@ConnectedSocket() client: Socket, @MessageBody() { roomID }: { roomID: string }) {
    if (!client.data?.user) {
      return client.emit('error', { message: 'Необходима авторизация' });
    }

    if (!this.isValidRoom(roomID)) {
      return client.emit('error', { message: 'Неверный ID комнаты' });
    }

    const userInfo = this.socketUsers.get(client.id);
    if (userInfo) {
      this.roomCreators.set(roomID, userInfo.email);
    }

    client.join(roomID);

    const rooms = this.socketRooms.get(client.id);
    if (rooms) {
      rooms.add(roomID);
    }

    this.shareRoomsInfoToClient(client);
    this.logger.debug(`[CREATE_ROOM] ${userInfo?.email} created ${roomID}`);
  }

  @SubscribeMessage(ACTIONS.PEER_STATUS_UPDATE)
  relayPeerStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() { room, status }: {
      room: string;
      status: Partial<{ video: boolean; audio: boolean; screenShare: boolean }>;
    }
  ) {
    if (!client.data?.user) return;
    if (!this.isValidRoom(room)) return;
    
    const userEmail = client.data.user.email;
    if (!this.checkRateLimit(`status:${userEmail}`, 20, 1000)) return;

    const senderInfo = this.socketUsers.get(client.id);
    if (!senderInfo) return;

    client.to(room).emit(ACTIONS.PEER_STATUS_UPDATE, {
      peerID: senderInfo.email,
      status,
    });
  }

  private shareRoomsInfoToClient(client: Socket) {
    const rooms = this.getClientRoomsForUser(client.id);
    client.emit(ACTIONS.SHARE_ROOMS, { rooms });
  }

  private getClientRoomsForUser(socketId: string): string[] {
    const userInfo = this.socketUsers.get(socketId);
    if (!userInfo) return [];

    const userEmail = userInfo.email;
    const allRooms = Array.from(this.server.adapter.rooms.keys());

    return allRooms.filter(roomID => {
      if (!roomID || typeof roomID !== 'string' || !roomID.startsWith('Room_')) {
        return false;
      }
      const creatorEmail = this.roomCreators.get(roomID);
      return creatorEmail === userEmail;
    });
  }

  private async sendUnreadCount(recipientEmail: string, senderEmail: string) {
    try {
      const count = await this.messageService.getUnreadCount(recipientEmail, senderEmail);
      this.server.to(recipientEmail).emit('unread_count', { from: senderEmail, count });
    } catch (error) {
      this.logger.warn(`[UNREAD_COUNT] Failed to get count: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async sendUnreadNotifications(email: string) {
    try {
      const chats = await this.messageService.getChats(email);
      for (const chat of chats) {
        if (chat.unreadCount > 0) {
          this.server.to(email).emit('unread_count', { from: chat.interlocutor, count: chat.unreadCount });
        }
      }
    } catch (error) {
      this.logger.warn(`[UNREAD_NOTIF] Failed for ${email}: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async notifyOnlineStatus(email: string, online: boolean) {
    try {
      const chats = await this.messageService.getChats(email);
      for (const chat of chats) {
        this.server.to(chat.interlocutor).emit('user_status', { email, online });
      }
    } catch (error) {
      this.logger.warn(`[ONLINE_STATUS] Failed for ${email}: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async sendOnlineStatusesToUser(email: string) {
    try {
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
    } catch (error) {
      this.logger.warn(`[ONLINE_STATUSES] Failed for ${email}: ${error instanceof Error ? error.message : error}`);
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
    try {
      client.emit('error', { message });
      client.disconnect();
    } catch (e) {
      this.logger.warn(`[DISCONNECT_ERROR] Failed: ${e}`);
    }
  }
}