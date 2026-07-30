import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './email.processor';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
    MailModule,
  ],
  providers: [EmailProcessor],
  exports: [BullModule],
})
export class QueueModule {}