import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { UserModule } from '../user/user.module';
import { AdvertisementModule } from '../advertisement/advertisement.module';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Advertisement, AdvertisementSchema } from '../advertisement/schemas/advertisement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Advertisement.name, schema: AdvertisementSchema }
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => AdvertisementModule),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}