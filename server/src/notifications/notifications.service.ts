import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(dto: {
    userEmail: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }): Promise<NotificationDocument> {
    const notification = new this.notificationModel(dto);
    return notification.save();
  }

  async getUnreadCount(userEmail: string): Promise<number> {
    return this.notificationModel.countDocuments({ userEmail, read: false });
  }

  async getRecent(userEmail: string, limit = 10): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ userEmail })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async markAsRead(notificationId: string, userEmail: string): Promise<void> {
    await this.notificationModel.updateOne(
      { _id: new Types.ObjectId(notificationId), userEmail },
      { read: true },
    );
  }

  async markAllAsRead(userEmail: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userEmail, read: false },
      { read: true },
    );
  }

  async getAllEmails(): Promise<string[]> {
    const users = await this.notificationModel.db.collection('users')
      .find({ isBlocked: { $ne: true } }, { projection: { email: 1 } })
      .toArray();
    return users.map((u: any) => u.email);
  }

  async createBulk(notifications: Array<{
    userEmail: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }>): Promise<{ insertedCount: number }> {
    if (notifications.length === 0) {
      return { insertedCount: 0 };
    }
    const result = await this.notificationModel.insertMany(notifications, { ordered: false });
    return { insertedCount: result.length };
  }
}