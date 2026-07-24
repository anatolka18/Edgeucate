import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CsrfGuard } from '../guards/csrf.guard';
import { Roles } from '../guards/roles.decorator';
import { Role } from '../user/schemas/user.schema';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(Role.TEACHER)
  create(@Body() createDto: CreateCalendarEventDto, @Request() req) {
    return this.calendarService.create(createDto, req.user.email);
  }

  @Get('teacher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  findAllByTeacher(@Request() req) {
    return this.calendarService.findAllByTeacher(req.user.email);
  }

  @Get('student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  findAllByStudent(@Request() req) {
    return this.calendarService.findAllByStudent(req.user.email);
  }

  @Get('teacherstudent')
  @UseGuards(JwtAuthGuard)
  findByTeacherAndStudent(@Query('teacherEmail') teacherEmail: string, @Query('studentEmail') studentEmail: string) {
    return this.calendarService.findByTeacherAndStudent(teacherEmail, studentEmail);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  delete(@Param('id') id: string, @Request() req) {
    return this.calendarService.delete(id, req.user.email);
  }
}