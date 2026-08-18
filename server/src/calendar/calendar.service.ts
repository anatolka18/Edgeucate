import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { CalendarEvent } from './schemas/calendar-event.schema';
import { APP_CONFIG } from '../common/config/app.config';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { PrometheusService } from '../prometheus/prometheus.service';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(CalendarEvent.name)
    private calendarEventModel: mongoose.Model<CalendarEvent>,
    private prometheusService: PrometheusService,
  ) {}

  async create(createDto: CreateCalendarEventDto, currentUserEmail: string): Promise<CalendarEvent> {
    if (createDto.teacher_email !== currentUserEmail) {
      throw new ForbiddenException('Вы можете создавать события только для себя как преподавателя');
    }

    const parsedDate = new Date(createDto.date);
    const [hours, minutes] = createDto.time.split(':').map(Number);
    const eventStart = new Date(parsedDate);
    eventStart.setHours(hours, minutes, 0, 0);
    const eventEnd = new Date(eventStart.getTime() + APP_CONFIG.CALENDAR.EVENT_DURATION_MS);

    const existingEvents = await this.calendarEventModel.find({
      teacher_email: createDto.teacher_email,
      date: parsedDate,
    }).lean();

    for (const event of existingEvents) {
      const [existingHours, existingMinutes] = event.time.split(':').map(Number);
      const existingStart = new Date(parsedDate);
      existingStart.setHours(existingHours, existingMinutes, 0, 0);
      const existingEnd = new Date(existingStart.getTime() + APP_CONFIG.CALENDAR.EVENT_DURATION_MS);

      if (eventStart < existingEnd && eventEnd > existingStart) {
        throw new BadRequestException('Выбранное время уже занято');
      }
    }

    const created = await this.calendarEventModel.create({
      ...createDto,
      date: parsedDate,
    });

    this.prometheusService.incrementCalendarEventCreated();

    return created;
  }

  async findAllByTeacher(teacherEmail: string): Promise<CalendarEvent[]> {
    return this.calendarEventModel.find({ teacher_email: teacherEmail }).exec();
  }

  async findAllByStudent(studentEmail: string): Promise<CalendarEvent[]> {
    return this.calendarEventModel.find({ student_email: studentEmail }).exec();
  }

  async findByTeacherAndStudent(teacherEmail: string, studentEmail: string): Promise<CalendarEvent[]> {
    return this.calendarEventModel.find({ teacher_email: teacherEmail, student_email: studentEmail }).exec();
  }

  async delete(eventId: string, currentUserEmail: string): Promise<{ success: boolean }> {
    const event = await this.calendarEventModel.findById(eventId);
    if (!event) throw new NotFoundException('Событие не найдено');

    if (event.teacher_email !== currentUserEmail && event.student_email !== currentUserEmail) {
      throw new ForbiddenException('Вы не можете удалить это событие');
    }

    await this.calendarEventModel.findByIdAndDelete(eventId);
    return { success: true };
  }
}