import { Controller, Get, UseGuards } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TurnService } from './turn.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('turn')
@Controller('turn')
export class TurnController {
  constructor(private readonly turnService: TurnService) {}

  @Get('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Получить TURN/STUN конфигурацию для WebRTC',
    description: 'Возвращает конфигурацию ICE серверов для установки WebRTC соединения. Включает: 1) публичный STUN сервер для обнаружения кандидатов, 2) защищённый TURN сервер с time-limited credentials (HMAC-SHA1, TTL 1 час) для обхода симметричного NAT. Credentials генерируются динамически и не хранятся в JS бандле. Требует JWT аутентификации.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Конфигурация ICE серверов',
    schema: {
      example: {
        iceServers: [
          {
            urls: ['stun:edgeucate.space:3478'],
          },
          {
            urls: [
              'turn:edgeucate.space:3478',
              'turn:edgeucate.space:3478?transport=tcp',
              'turns:edgeucate.space:5349?transport=tcp',
            ],
            username: '1693123456:user@example.com',
            credential: 'H9k3fJ8xQ2pL5nM7rT1vW4yZ6aB0cD2eF3gH5iJ7kL9=',
          },
        ],
        iceTransportPolicy: 'all',
        iceCandidatePoolSize: 10,
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
    status: 500, 
    description: 'Ошибка генерации TURN credentials',
    schema: {
      example: {
        statusCode: 500,
        message: 'Не удалось сгенерировать TURN credentials',
        error: 'Internal Server Error',
      },
    },
  })
  getConfig() {
    return this.turnService.getCredentials();
  }
}