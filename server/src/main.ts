import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { SocketAdapter } from './common/adapters/socket.adapter';
import * as express from 'express';
import helmet from 'helmet';
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.useWebSocketAdapter(new SocketAdapter(app));

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "wss:", "ws:", "https:"],
        mediaSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xContentTypeOptions: true,
    xFrameOptions: { action: "deny" },
  }));

  app.enableCors({
    origin: process.env.CORS_ORIGINS || process.env.CLIENT_URL,
    credentials: true,
  });
  app.use(new CsrfMiddleware().use);
  app.use(cookieParser());

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Edgeucate API')
    .setDescription(`
## API для платформы Edgeucate

### Аутентификация
- **JWT Access Token** — заголовок \`Authorization: Bearer <token>\`
- **Refresh Token** — httpOnly cookie \`refreshToken\`
- **CSRF Token** — заголовок \`x-csrf-token\` (получить: \`GET /api/csrf-token\`)

### Модули
- **app** — корневые эндпоинты
- **auth** — аутентификация (регистрация, вход, logout)
- **profile** — профиль и администрирование
- **advertisements** — объявления репетиторов
- **messages** — чаты (REST)
- **websocket** — real-time чат и WebRTC (Socket.IO: \`/users\`)
- **calendar** — планирование занятий
- **feedback** — отзывы
- **storage** — загрузка файлов
- **turn** — WebRTC credentials
    `)
    .setVersion('1.0.0')
    .setContact('Edgeucate Team', 'https://edgeucate.space', 'contact@edgeucate.space')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('refreshToken')
    .addTag('app', 'Корневые эндпоинты')
    .addTag('auth', 'Аутентификация')
    .addTag('profile', 'Профиль и администрирование')
    .addTag('advertisements', 'Объявления репетиторов')
    .addTag('messages', 'Чаты и сообщения (REST)')
    .addTag('calendar', 'Планирование занятий')
    .addTag('feedback', 'Отзывы')
    .addTag('storage', 'Загрузка файлов')
    .addTag('turn', 'WebRTC credentials')
    .addServer('http://localhost:4200', 'Development')
    .addServer('https://edgeucate.space', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Edgeucate API Documentation',
  });

  app.enableShutdownHooks();
  await app.listen(4200);
}
bootstrap();