import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CsrfGuard } from '../guards/csrf.guard';
import { Roles } from '../guards/roles.decorator';
import { Role } from '../user/schemas/user.schema';

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Создать событие календаря',
    description: 'Создаёт новое запланированное занятие между учителем и студентом. Доступно только пользователям с ролью TEACHER. Проверяет конфликты в расписании. Требует JWT аутентификации, роли и CSRF токена.',
  })
  @ApiBody({ type: CreateCalendarEventDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Событие успешно создано',
    schema: {
      example: {
        _id: '64f1a2b3c4d5e6f7g8h9i0j1',
        teacher_email: 'teacher@example.com',
        student_email: 'student@example.com',
        teacher_username: 'Иван Иванов',
        student_username: 'Мария Петрова',
        title: 'Урок математики: подготовка к ЕГЭ',
        date: '2026-09-15',
        time: '14:30',
        cost: 1500,
        createdAt: '2026-08-30T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Невалидные данные (валидация)',
    schema: {
      example: {
        statusCode: 400,
        message: ['Время должно быть в формате HH:mm'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Нет прав (нужна роль TEACHER или невалидный CSRF токен)',
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Конфликт расписания (время уже занято)',
    schema: {
      example: {
        statusCode: 409,
        message: 'У учителя уже есть занятие в это время',
        error: 'Conflict',
      },
    },
  })
  create(@Body() createDto: CreateCalendarEventDto, @Request() req) {
    return this.calendarService.create(createDto, req.user.email);
  }

  @Get('teacher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Получить все события учителя',
    description: 'Возвращает список всех запланированных занятий текущего учителя (по email из JWT токена). Доступно только пользователям с ролью TEACHER.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список событий учителя',
    schema: {
      example: [
        {
          _id: '64f1a2b3c4d5e6f7g8h9i0j1',
          teacher_email: 'teacher@example.com',
          student_email: 'student@example.com',
          teacher_username: 'Иван Иванов',
          student_username: 'Мария Петрова',
          title: 'Урок математики: подготовка к ЕГЭ',
          date: '2026-09-15',
          time: '14:30',
          cost: 1500,
        },
        {
          _id: '64f1a2b3c4d5e6f7g8h9i0j2',
          teacher_email: 'teacher@example.com',
          student_email: 'student2@example.com',
          teacher_username: 'Иван Иванов',
          student_username: 'Пётр Сидоров',
          title: 'Урок физики',
          date: '2026-09-16',
          time: '10:00',
          cost: 2000,
        },
      ],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Нет запланированных занятий',
    schema: {
      example: [],
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован',
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Нет прав (нужна роль TEACHER)',
  })
  findAllByTeacher(@Request() req) {
    return this.calendarService.findAllByTeacher(req.user.email);
  }

  @Get('student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Получить все события студента',
    description: 'Возвращает список всех запланированных занятий текущего студента (по email из JWT токена). Доступно только пользователям с ролью STUDENT.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список событий студента',
    schema: {
      example: [
        {
          _id: '64f1a2b3c4d5e6f7g8h9i0j1',
          teacher_email: 'teacher@example.com',
          student_email: 'student@example.com',
          teacher_username: 'Иван Иванов',
          student_username: 'Мария Петрова',
          title: 'Урок математики: подготовка к ЕГЭ',
          date: '2026-09-15',
          time: '14:30',
          cost: 1500,
        },
      ],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Нет запланированных занятий',
    schema: {
      example: [],
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован',
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Нет прав (нужна роль STUDENT)',
  })
  findAllByStudent(@Request() req) {
    return this.calendarService.findAllByStudent(req.user.email);
  }

  @Get('teacherstudent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Найти события между парой учитель-студент',
    description: 'Возвращает список запланированных занятий между конкретным учителем и студентом. Используется для планирования новых занятий и проверки занятости. Требует JWT аутентификации (любая роль).',
  })
  @ApiQuery({ 
    name: 'teacherEmail', 
    required: true, 
    description: 'Email учителя',
    example: 'teacher@example.com',
  })
  @ApiQuery({ 
    name: 'studentEmail', 
    required: true, 
    description: 'Email студента',
    example: 'student@example.com',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список событий между парой',
    schema: {
      example: [
        {
          _id: '64f1a2b3c4d5e6f7g8h9i0j1',
          teacher_email: 'teacher@example.com',
          student_email: 'student@example.com',
          title: 'Урок математики',
          date: '2026-09-15',
          time: '14:30',
          cost: 1500,
        },
      ],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Событий между этой парой нет',
    schema: {
      example: [],
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован',
  })
  findByTeacherAndStudent(@Query('teacherEmail') teacherEmail: string, @Query('studentEmail') studentEmail: string) {
    return this.calendarService.findByTeacherAndStudent(teacherEmail, studentEmail);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Удалить событие календаря',
    description: 'Удаляет запланированное занятие по ID. Удаление может выполнить только участник события (учитель или студент). Требует JWT аутентификации и CSRF токена.',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'MongoDB ObjectId события для удаления',
    example: '64f1a2b3c4d5e6f7g8h9i0j1',
    type: String,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Событие успешно удалено',
    schema: {
      example: {
        message: 'Событие удалено',
        deletedId: '64f1a2b3c4d5e6f7g8h9i0j1',
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован',
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Нет прав (не участник события или невалидный CSRF токен)',
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Событие не найдено',
    schema: {
      example: {
        statusCode: 404,
        message: 'Событие не найдено',
        error: 'Not Found',
      },
    },
  })
  delete(@Param('id') id: string, @Request() req) {
    return this.calendarService.delete(id, req.user.email);
  }
}