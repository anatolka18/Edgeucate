import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { CalendarEvent } from './schemas/calendar-event.schema';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(CalendarEvent.name)
    private calendarEventModel: mongoose.Model<CalendarEvent>,
  ) {}

  async create(createDto: CreateCalendarEventDto, currentUserEmail: string): Promise<CalendarEvent> {
    if (createDto.teacher_email !== currentUserEmail) {
      throw new ForbiddenException('Вы можете создавать события только для себя как преподавателя');
    }

    const parsedDate = new Date(createDto.date);
    const [hours, minutes] = createDto.time.split(':').map(Number);
    const eventStart = new Date(parsedDate.setHours(hours, minutes, 0, 0));
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);

    const conflict = await this.calendarEventModel.findOne({
      teacher_email: createDto.teacher_email,
      date: parsedDate,
      $or: [
        { time: createDto.time },
        {
          $expr: {
            $and: [
              { $lt: ['$time', createDto.time] },
              { $gt: ['$time', createDto.time] }
            ]
          }
        }
      ]
    });

    if (conflict) {
      throw new BadRequestException('Выбранное время уже занято');
    }

    return this.calendarEventModel.create({
      ...createDto,
      date: parsedDate,
    });
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