import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { MessageService } from './message.service';
import { SendMessageDto } from '../user/dto/sendMessage.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CsrfGuard } from '../guards/csrf.guard';
import { Message } from './schemas/message.schema';

@ApiTags('messages')
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Отправить сообщение',
    description: 'Отправляет сообщение другому пользователю. Поле `sender` автоматически устанавливается из JWT токена — его не нужно передавать в теле запроса. Требует JWT аутентификации и CSRF токена.',
  })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Сообщение успешно отправлено',
    type: Message,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Невалидные данные (пустое сообщение, неверный формат)',
    schema: {
      example: {
        statusCode: 400,
        message: ['message must be longer than or equal to 1 characters'],
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
    status: 404, 
    description: 'Получатель не найден',
  })
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    dto.sender = req.user.email;
    return this.messageService.sendMessage(dto);
  }

  @Post('get')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Получить историю сообщений',
    description: 'Возвращает историю переписки между текущим пользователем (из JWT) и указанным пользователем. Поддерживает пагинацию через cursor (`before`). Сообщения отсортированы по дате (новые внизу). Требует JWT аутентификации и CSRF токена.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        recipient: {
          type: 'string',
          format: 'email',
          description: 'Email собеседника',
          example: 'friend@example.com',
        },
        limit: {
          type: 'number',
          description: 'Количество сообщений для загрузки (по умолчанию 50)',
          example: 50,
          default: 50,
          minimum: 1,
          maximum: 100,
        },
        before: {
          type: 'string',
          description: 'Cursor для пагинации — ID или дата сообщения до которого нужно загрузить',
          example: '2026-08-30T12:00:00.000Z',
        },
      },
      required: ['recipient'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'История сообщений',
    schema: {
      example: [
        {
          _id: '64f1a2b3c4d5e6f7g8h9i0j1',
          sender: 'friend@example.com',
          recipient: 'user@example.com',
          message: 'Привет! Как дела с подготовкой к экзамену?',
          checked: true,
          date: '2026-08-29T10:15:00.000Z',
          edited: false,
          deleted: false,
        },
        {
          _id: '64f1a2b3c4d5e6f7g8h9i0j2',
          sender: 'user@example.com',
          recipient: 'friend@example.com',
          message: 'Всё отлично! Спасибо за помощь.',
          checked: true,
          date: '2026-08-29T10:20:00.000Z',
          edited: false,
          deleted: false,
        },
      ],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Сообщений нет',
    schema: {
      example: [],
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Не указан получатель',
    schema: {
      example: {
        statusCode: 400,
        message: 'Recipient is required',
        error: 'Bad Request',
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
  async getMessages(@Request() req, @Body() body: { recipient: string; limit?: number; before?: string }) {
    const sender = req.user.email;
    const { recipient, limit = 50, before } = body;
    
    if (!recipient) {
      throw new BadRequestException('Recipient is required');
    }
    
    return this.messageService.getMessages(sender, recipient, limit, before);
  }

  @Post('chats')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Получить список чатов',
    description: 'Возвращает список всех чатов текущего пользователя (из JWT) с последними сообщениями и информацией о собеседниках. Используется для отображения списка диалогов. Требует JWT аутентификации и CSRF токена.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список чатов пользователя',
    schema: {
      example: [
        {
          interlocutor: 'friend@example.com',
          username: 'Иван Иванов',
          avatar: '/avatars/friend_example_com.webp?v=1693123456789',
          lastMessage: {
            message: 'Всё отлично! Спасибо за помощь.',
            sender: 'user@example.com',
            date: '2026-08-29T10:20:00.000Z',
            checked: true,
          },
          unreadCount: 0,
        },
        {
          interlocutor: 'teacher@example.com',
          username: 'Мария Петрова',
          avatar: '/avatars/teacher_example_com.webp?v=1693123456789',
          lastMessage: {
            message: 'Когда удобно созвониться?',
            sender: 'teacher@example.com',
            date: '2026-08-30T14:00:00.000Z',
            checked: false,
          },
          unreadCount: 2,
        },
      ],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Чатов нет',
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
    description: 'Невалидный CSRF токен',
  })
  async getChats(@Request() req) {
    const email = req.user.email;
    return this.messageService.getChats(email);
  }

  @Post('mark-read')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Пометить сообщения как прочитанные',
    description: 'Помечает все непрочитанные сообщения от указанного пользователя как прочитанные. Используется при открытии чата. Требует JWT аутентификации и CSRF токена.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fromEmail: {
          type: 'string',
          format: 'email',
          description: 'Email отправителя чьи сообщения нужно пометить прочитанными',
          example: 'friend@example.com',
        },
      },
      required: ['fromEmail'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Сообщения помечены как прочитанные',
    schema: {
      example: {
        success: true,
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
  async markAsRead(@Request() req, @Body() body: { fromEmail: string }) {
    const readerEmail = req.user.email;
    await this.messageService.markMessagesAsRead(readerEmail, body.fromEmail);
    return { success: true };
  }

  @Post('unread-count')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Получить количество непрочитанных сообщений',
    description: 'Возвращает количество непрочитанных сообщений от указанного отправителя. Используется для отображения badge на аватаре чата. Требует JWT аутентификации и CSRF токена.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        senderEmail: {
          type: 'string',
          format: 'email',
          description: 'Email отправителя чьи непрочитанные сообщения нужно посчитать',
          example: 'teacher@example.com',
        },
      },
      required: ['senderEmail'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Количество непрочитанных сообщений',
    schema: {
      example: {
        count: 3,
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Непрочитанных сообщений нет',
    schema: {
      example: {
        count: 0,
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
  async getUnreadCount(@Request() req, @Body() body: { senderEmail: string }) {
    const recipientEmail = req.user.email;
    const count = await this.messageService.getUnreadCount(recipientEmail, body.senderEmail);
    return { count };
  }
}