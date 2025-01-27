import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum Role {
  STUDENT = 'Student',
  TEACHER = 'Teacher',
  ADMIN = 'Admin',
}

export class Notification {
  type: string;
  text: string;
  checked: boolean;
  date: Date;
}

export class Message {
  message: string;
  checked: boolean;
  date: Date;
  sender: string;
}

export class Chat {
  interlocutor: string;
  avatar: string;
  messages: Message[];
}

export class Feedback {
  advertisementId: string;
  username: string;
  text: string;
  title: string;
  stars: number;
  date: Date;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  role: Role;

  @Prop({ required: true })
  avatar: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  courses: string[];

  @Prop({ required: true })
  chat: Chat[];

  @Prop({ required: true })
  feedback: Feedback[];

  @Prop({ required: true })
  notifications: Notification[];

  @Prop({ default: [] })
  students: string[];

  @Prop({ required: true })
  online: boolean;

  @Prop({ required: true })
  dateLastOnline: Date;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop()
  blockReason?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);