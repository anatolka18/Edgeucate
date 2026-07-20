import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true, index: true })
  sender: string;

  @Prop({ required: true, index: true })
  recipient: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  checked: boolean;

  @Prop({ default: Date.now })
  date: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ sender: 1, recipient: 1, date: -1 });
MessageSchema.index({ recipient: 1, checked: 1, sender: 1 });