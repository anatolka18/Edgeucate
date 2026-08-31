import { Controller, Get, Put, Body, Param, UseGuards, Post, BadRequestException, Patch, Query } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { StudentService } from './student.service';
import { MessageService } from '../message/message.service';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CsrfGuard } from '../guards/csrf.guard';
import { Roles } from '../guards/roles.decorator';
import { Role } from './schemas/user.schema';
import { UpdateUserDto } from './dto/updateUser.dto';

@ApiTags('profile')
@Controller('profile')
export class UserController {
  constructor(
    private userService: UserService,
    private studentService: StudentService,
    private messageService: MessageService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Получить всех пользователей (только для администраторов)',
    description: 'Возвращает список всех пользователей системы с пагинацией. Доступно только пользователям с ролью ADMIN.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1, type: Number })
  @ApiQuery({ name: 'limit', required: false, example: 20, type: Number })
  @ApiResponse({ status: 200, description: 'Список пользователей' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Нет прав (нужна роль ADMIN)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.findAll(
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  @Put()
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Обновить профиль пользователя',
    description: 'Обновляет данные профиля. Требует JWT аутентификации и CSRF токена.',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Профиль успешно обновлён' })
  @ApiResponse({ status: 400, description: 'Невалидные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Невалидный CSRF токен' })
  updateProfile(@Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.userService.updateUser(updateUserDto);
  }

  @Get(':username')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Получить профиль пользователя по username',
    description: 'Возвращает публичные данные пользователя по его имени.',
  })
  @ApiParam({ name: 'username', example: 'Иван Иванов', type: String })
  @ApiResponse({ status: 200, description: 'Профиль пользователя' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  getUser(@Param('username') username: string) {
    return this.userService.findByUsername(username);
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Получить историю сообщений между пользователями',
    description: '⚠️ Рекомендуется использовать `POST /messages/get` для новых интеграций.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sender: { type: 'string', format: 'email', example: 'user1@example.com' },
        recipient: { type: 'string', format: 'email', example: 'user2@example.com' },
      },
      required: ['sender', 'recipient'],
    },
  })
  @ApiResponse({ status: 200, description: 'Список сообщений' })
  @ApiResponse({ status: 400, description: 'Не указаны email' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getMessages(
    @Body('sender') senderEmail: string,
    @Body('recipient') recipientEmail: string,
  ) {
    if (!senderEmail || !recipientEmail) {
      throw new BadRequestException('Оба email обязательны.');
    }
    return this.messageService.getMessages(senderEmail, recipientEmail);
  }

  @Post('chats')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Получить список чатов пользователя',
    description: '⚠️ Рекомендуется использовать `POST /messages/chats` для новых интеграций.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
      },
      required: ['email'],
    },
  })
  @ApiResponse({ status: 200, description: 'Список чатов' })
  @ApiResponse({ status: 400, description: 'Не указан email' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getChats(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.messageService.getChats(email);
  }

  @Post('student/add')
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Добавить студента',
    description: 'Добавляет студента в список учеников учителя. Доступно только TEACHER.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        teacherEmail: { type: 'string', format: 'email', example: 'teacher@example.com' },
        studentEmail: { type: 'string', format: 'email', example: 'student@example.com' },
      },
      required: ['teacherEmail', 'studentEmail'],
    },
  })
  @ApiResponse({ status: 200, description: 'Студент добавлен' })
  @ApiResponse({ status: 400, description: 'Не указаны email' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  async addStudent(
    @Body('teacherEmail') teacherEmail: string,
    @Body('studentEmail') studentEmail: string
  ) {
    if (!teacherEmail || !studentEmail) {
      throw new BadRequestException('Teacher email and student email are required');
    }
    return this.studentService.addStudent(teacherEmail, studentEmail);
  }

  @Post('student/remove')
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Удалить студента',
    description: 'Удаляет студента из списка учеников учителя. Доступно только TEACHER.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        teacherEmail: { type: 'string', format: 'email', example: 'teacher@example.com' },
        studentEmail: { type: 'string', format: 'email', example: 'student@example.com' },
      },
      required: ['teacherEmail', 'studentEmail'],
    },
  })
  @ApiResponse({ status: 200, description: 'Студент удалён' })
  @ApiResponse({ status: 400, description: 'Не указаны email' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async removeStudent(
    @Body('teacherEmail') teacherEmail: string,
    @Body('studentEmail') studentEmail: string
  ) {
    if (!teacherEmail || !studentEmail) {
      throw new BadRequestException('Teacher email and student email are required');
    }
    return this.studentService.removeStudent(teacherEmail, studentEmail);
  }

  @Post('student/check')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Проверить является ли пользователь студентом учителя',
    description: 'Возвращает `{ isStudent: boolean }`.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        teacherEmail: { type: 'string', format: 'email', example: 'teacher@example.com' },
        studentEmail: { type: 'string', format: 'email', example: 'student@example.com' },
      },
      required: ['teacherEmail', 'studentEmail'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Результат проверки',
    schema: { example: { isStudent: true } },
  })
  @ApiResponse({ status: 400, description: 'Не указаны email' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async checkIfStudent(
    @Body('teacherEmail') teacherEmail: string,
    @Body('studentEmail') studentEmail: string
  ) {
    if (!teacherEmail || !studentEmail) {
      throw new BadRequestException('Teacher email and student email are required');
    }
    return {
      isStudent: await this.studentService.checkIfStudent(teacherEmail, studentEmail)
    };
  }

  @Patch(':email/block')
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Заблокировать/разблокировать пользователя (только ADMIN)',
    description: 'Изменяет статус блокировки пользователя. Доступно только ADMIN.',
  })
  @ApiParam({ name: 'email', example: 'user@example.com', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isBlocked: { type: 'boolean', example: true },
        blockReason: { type: 'string', example: 'Нарушение правил'},
      },
      required: ['isBlocked'],
    },
  })
  @ApiResponse({ status: 200, description: 'Статус обновлён' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async blockUser(
    @Param('email') email: string,
    @Body('isBlocked') isBlocked: boolean,
    @Body('blockReason') blockReason?: string,
  ) {
    return this.userService.blockUser(email, isBlocked, blockReason);
  }
}