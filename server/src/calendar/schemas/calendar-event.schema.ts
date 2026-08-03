import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CalendarEventDocument = HydratedDocument<CalendarEvent>;

@Schema({ timestamps: true })
export class CalendarEvent {
  @Prop({ required: true })
  teacher_email: string;

  @Prop({ required: true })
  student_email: string;

  @Prop({ required: true })
  teacher_username: string;

  @Prop({ required: true })
  student_username: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  time: string;

  @Prop({ required: true })
  cost: number;
}

export const CalendarEventSchema = SchemaFactory.createForClass(CalendarEvent);

CalendarEventSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret: any) => {
    delete ret.__v;
    if (ret._id) ret._id = ret._id.toString();
    return ret;
  }
});