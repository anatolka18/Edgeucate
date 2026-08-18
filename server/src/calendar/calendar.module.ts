import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { CalendarEvent, CalendarEventSchema } from './schemas/calendar-event.schema';
import { AuthModule } from '../auth/auth.module';
import { PrometheusModule } from '../prometheus/prometheus.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CalendarEvent.name, schema: CalendarEventSchema }]),
    AuthModule,
    PrometheusModule,
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}