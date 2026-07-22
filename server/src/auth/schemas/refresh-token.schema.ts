import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true, index: { expires: 0 } })
  expires: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);