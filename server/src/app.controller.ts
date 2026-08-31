import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Request } from 'express';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Название проекта',
    description: 'Публичный эндпоинт для проверки доступности API',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Название проекта',
    schema: { type: 'string', example: 'Edgeucate API' },
  })
  getNameProject(): string {
    return this.appService.getNameProject();
  }

  @Get('csrf-token')
  @ApiCookieAuth('csrf-token')
  @ApiOperation({ 
    summary: 'Получить CSRF токен',
    description: 'Возвращает CSRF токен из cookie. Передавать в заголовке x-csrf-token для POST/PUT/PATCH/DELETE запросов.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'CSRF токен',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'a1b2c3d4e5f6...' },
      },
    },
  })
  getCsrfToken(@Req() req: Request) {
    const token = req.cookies?.['csrf-token'] || '';
    return { token };
  }
}