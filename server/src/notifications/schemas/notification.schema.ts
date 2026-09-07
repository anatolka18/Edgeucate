import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  NEW_REVIEW = 'new_review',
  BOOKING_REQUEST = 'booking_request',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, index: true })
  userEmail: string;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object })
  data: Record<string, any>;

  @Prop({ default: false, index: true })
  read: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userEmail: 1, createdAt: -1 });
NotificationSchema.index({ userEmail: 1, read: 1 });