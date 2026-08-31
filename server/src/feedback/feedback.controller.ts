import { Controller, Post, Get, Body, Param, UseGuards, Delete, Request, ForbiddenException } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CsrfGuard } from '../guards/csrf.guard';
import { Role } from '../user/schemas/user.schema';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Создать отзыв',
    description: 'Создаёт новый отзыв студента о преподавателе. Перед созданием рекомендуется проверить через /can-leave что студент имеет право оставить отзыв. Требует JWT аутентификации и CSRF токена.',
  })
  @ApiBody({ type: CreateFeedbackDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Отзыв успешно создан',
    schema: {
      example: {
        _id: '64f1a2b3c4d5e6f7g8h9i0j1',
        advertisementId: '64f1a2b3c4d5e6f7g8h9i0j0',
        studentEmail: 'student@example.com',
        teacherEmail: 'teacher@example.com',
        title: 'Лучший репетитор по математике!',
        text: 'Отличный преподаватель! Объясняет понятно, всегда готов помочь.',
        stars: 5,
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
        message: ['Оценка должна быть от 1 до 5'],
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
    description: 'Невалидный CSRF токен',
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Студент уже оставлял отзыв по этому объявлению',
    schema: {
      example: {
        statusCode: 409,
        message: 'Вы уже оставили отзыв по этому объявлению',
        error: 'Conflict',
      },
    },
  })
  async createFeedback(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(createFeedbackDto);
  }

  @Get('user/:email')
  @ApiOperation({ 
    summary: 'Получить все отзывы пользователя',
    description: 'Возвращает список всех отзывов, оставленных о пользователе (по его email). Публичный endpoint — доступен без аутентификации.',
  })
  @ApiParam({ 
    name: 'email', 
    description: 'Email пользователя, чьи отзывы нужно получить',
    example: 'teacher@example.com',
    type: String,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список отзывов пользователя',
    schema: {
      example: [
        {
          _id: '64f1a2b3c4d5e6f7g8h9i0j1',
          advertisementId: '64f1a2b3c4d5e6f7g8h9i0j0',
          studentEmail: 'student@example.com',
          teacherEmail: 'teacher@example.com',
          title: 'Лучший репетитор по математике!',
          text: 'Отличный преподаватель! Объясняет понятно, всегда готов помочь.',
          stars: 5,
          createdAt: '2026-08-30T12:00:00.000Z',
          student: {
            username: 'Мария Петрова',
            avatar: '/avatars/student_example_com.webp?v=1693123456789',
          },
        },
      ],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Отзывов нет',
    schema: {
      example: [],
    },
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Пользователь не найден',
  })
  async getUserFeedbacks(@Param('email') email: string) {
    return this.feedbackService.getUserFeedbacks(email);
  }

  @Post('can-leave')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Проверить может ли студент оставить отзыв',
    description: 'Проверяет имеет ли студент право оставить отзыв о преподавателе (например, были ли занятия между ними). Используется фронтендом для показа/скрытия формы отзыва. Требует JWT аутентификации и CSRF токена.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        teacherEmail: {
          type: 'string',
          format: 'email',
          description: 'Email преподавателя',
          example: 'teacher@example.com',
        },
        studentEmail: {
          type: 'string',
          format: 'email',
          description: 'Email студента',
          example: 'student@example.com',
        },
        advertisementId: {
          type: 'string',
          description: 'ID объявления',
          example: '64f1a2b3c4d5e6f7g8h9i0j1',
        },
      },
      required: ['teacherEmail', 'studentEmail', 'advertisementId'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Студент может оставить отзыв',
    schema: {
      example: {
        canLeave: true,
        reason: 'У вас были занятия с этим преподавателем',
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Студент НЕ может оставить отзыв',
    schema: {
      example: {
        canLeave: false,
        reason: 'У вас не было занятий с этим преподавателем',
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован',
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Невалидный CSRF токен',
  })
  async canStudentLeaveFeedback(
    @Body('teacherEmail') teacherEmail: string,
    @Body('studentEmail') studentEmail: string,
    @Body('advertisementId') advertisementId: string,
  ) {
    return this.feedbackService.canStudentLeaveFeedback(teacherEmail, studentEmail, advertisementId);
  }

  @Delete('delete/:teacherEmail/:advertisementId/:username')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Удалить отзыв',
    description: 'Удаляет отзыв. Удаление может выполнить только: 1) автор отзыва (по совпадению username) или 2) администратор (роль ADMIN). Требует JWT аутентификации и CSRF токена.',
  })
  @ApiParam({ 
    name: 'teacherEmail', 
    description: 'Email преподавателя (чьи отзывы)',
    example: 'teacher@example.com',
    type: String,
  })
  @ApiParam({ 
    name: 'advertisementId', 
    description: 'ID объявления',
    example: '64f1a2b3c4d5e6f7g8h9i0j1',
    type: String,
  })
  @ApiParam({ 
    name: 'username', 
    description: 'Username автора отзыва',
    example: 'Мария Петрова',
    type: String,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Отзыв успешно удалён',
    schema: {
      example: {
        message: 'Отзыв удалён',
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
    description: 'Нет прав на удаление (не автор и не администратор)',
    schema: {
      example: {
        statusCode: 403,
        message: 'Вы не можете удалить этот отзыв',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Отзыв не найден',
  })
  async deleteFeedback(
    @Request() req,
    @Param('teacherEmail') teacherEmail: string,
    @Param('advertisementId') advertisementId: string,
    @Param('username') username: string,
  ) {
    const currentUser = req.user;
    
    if (currentUser.role !== Role.ADMIN && currentUser.username !== username) {
      throw new ForbiddenException('Вы не можете удалить этот отзыв');
    }

    return this.feedbackService.deleteFeedback(teacherEmail, username, advertisementId);
  }
}