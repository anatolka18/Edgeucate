import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AdvertisementModule } from './advertisement/advertisement.module';
import { FeedbackModule } from './feedback/feedback.module';
import { CalendarModule } from './calendar/calendar.module';
import { MessageModule } from './message/message.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MailModule } from './mail/mail.module';
import { ClientErrorsController } from './common/controllers/client-errors.controller';
import { QueueModule } from './queue/queue.module';
import { TurnModule } from './turn/turn.module';
import { StorageModule } from './storage/storage.module';
import { PrometheusModule } from './prometheus/prometheus.module';
import { HttpMetricsInterceptor } from './common/interceptors/http-metrics.interceptor';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    AuthModule,
    UserModule,
    AdvertisementModule,
    FeedbackModule,
    CalendarModule,
    MessageModule,
    MailModule,
    QueueModule,
    TurnModule,
    StorageModule,
    PrometheusModule,
    NotificationsModule,
  ],
  controllers: [AppController, ClientErrorsController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
})
export class AppModule {}