import { forwardRef, Module } from '@nestjs/common';
import { AdvertisementService } from './advertisement.service';
import { AdvertisementController } from './advertisement.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AdvertisementSchema } from './schemas/advertisement.schema';
import { UserSchema } from '../user/schemas/user.schema';
import { UserModule } from '../user/user.module';
import { PrometheusModule } from '../prometheus/prometheus.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Advertisement', schema: AdvertisementSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    forwardRef(() => UserModule),
    PrometheusModule,
  ],
  controllers: [AdvertisementController],
  providers: [AdvertisementService],
  exports: [AdvertisementService],
})
export class AdvertisementModule {}