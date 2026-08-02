import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
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
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
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

  await app.listen(4200);
}
bootstrap();