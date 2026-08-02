import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { RefreshTokenSchema } from '../auth/schemas/refresh-token.schema';
import { AuthModule } from '../auth/auth.module';
import { UserSocketService } from './user.gateway';
import { MessageModule } from '../message/message.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'RefreshToken', schema: RefreshTokenSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
    MessageModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserSocketService],
  exports: [UserService],
})
export class UserModule {}