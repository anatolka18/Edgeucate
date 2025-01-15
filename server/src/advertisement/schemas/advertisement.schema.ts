import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdvertisementDocument = HydratedDocument<Advertisement>;

@Schema({ timestamps: true })
export class Advertisement {
  @Prop({ required: true }) advertisementId: string;
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) creator: string;
  @Prop({ required: true }) email: string;
  @Prop({ required: true }) subject: string;
  @Prop({ required: true }) aboutAdvertisement: string;
  @Prop({ required: true }) aboutTeacher: string;
  @Prop({ required: true }) avatar: string;
  @Prop({ required: true }) price: number;
  @Prop({ required: true }) stars: number;
  @Prop({ required: true }) date: Date;
}

export const AdvertisementSchema = SchemaFactory.createForClass(Advertisement);