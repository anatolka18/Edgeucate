import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @ApiProperty({
    description: 'Email отправителя сообщения',
    example: 'sender@example.com',
  })
  @Prop({ required: true, index: true })
  sender: string;

  @ApiProperty({
    description: 'Email получателя сообщения',
    example: 'recipient@example.com',
  })
  @Prop({ required: true, index: true })
  recipient: string;

  @ApiProperty({
    description: 'Текст сообщения',
    example: 'Привет! Когда можем созвониться для обсуждения занятий?',
  })
  @Prop({ required: true })
  message: string;

  @ApiProperty({
    description: 'Флаг прочтения сообщения',
    example: false,
    default: false,
  })
  @Prop({ default: false })
  checked: boolean;

  @ApiProperty({
    description: 'Дата и время отправки сообщения',
    example: '2026-08-30T12:00:00.000Z',
    format: 'date-time',
  })
  @Prop({ default: Date.now })
  date: Date;

  @ApiProperty({
    description: 'Флаг редактирования сообщения',
    example: false,
    default: false,
  })
  @Prop({ default: false })
  edited: boolean;

  @ApiProperty({
    description: 'Флаг удаления сообщения (мягкое удаление)',
    example: false,
    default: false,
  })
  @Prop({ default: false })
  deleted: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ sender: 1, recipient: 1, date: -1 });
MessageSchema.index({ recipient: 1, checked: 1, sender: 1 });

MessageSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret: any) => {
    delete ret.__v;
    if (ret._id) ret._id = ret._id.toString();
    return ret;
  }
});