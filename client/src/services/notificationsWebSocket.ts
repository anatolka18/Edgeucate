import { io, Socket } from 'socket.io-client';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

class NotificationsWebSocketService {
  socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string) {
    if (this.socket && (this.socket.connected || this.socket.active)) {
      return;
    }

    if (!token) return;

    this.socket = io('/notifications', {
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('[WS-Notifications] Connected');
      this.emit('connected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('[WS-Notifications] Connect error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WS-Notifications] Disconnected:', reason);
      this.emit('disconnected');
    });

    this.socket.on('unread_count', (data: { count: number }) => {
      this.emit('unread_count', data.count);
    });

    this.socket.on('new_notification', (notification: Notification) => {
      this.emit('new_notification', notification);
    });

    this.socket.on('notifications_list', (notifications: Notification[]) => {
      this.emit('notifications_list', notifications);
    });

    this.socket.on('marked_read', () => {
      this.emit('marked_read');
    });

    this.socket.on('marked_all_read', () => {
      this.emit('marked_all_read');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getNotifications(limit = 20) {
    if (!this.socket?.connected) {
      console.warn('[WS-Notifications] Socket not connected');
      return;
    }
    this.socket.emit('get_notifications', { limit });
  }

  markAsRead(notificationId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('mark_read', { notificationId });
  }

  markAllAsRead() {
    if (!this.socket?.connected) return;
    this.socket.emit('mark_all_read');
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

export const notificationsWebSocket = new NotificationsWebSocketService();