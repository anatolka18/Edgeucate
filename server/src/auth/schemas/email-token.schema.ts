import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EmailTokenDocument = HydratedDocument<EmailToken>;

@Schema({ timestamps: true })
export class EmailToken {
  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  type: 'verify' | 'reset';

  @Prop({ required: true })
  expires: Date;
}

export const EmailTokenSchema = SchemaFactory.createForClass(EmailToken);
EmailTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

EmailTokenSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret: any) => {
    delete ret.__v;
    if (ret._id) ret._id = ret._id.toString();
    return ret;
  }
});