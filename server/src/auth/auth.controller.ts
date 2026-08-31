import { Controller, Get, Post, Body, Request, UseGuards, Res, Req, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CsrfGuard } from '../guards/csrf.guard';
import { Response, Request as ExpressRequest } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto } from './dto/change-password.dto';
import { APP_CONFIG } from '../common/config/app.config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private get isCookieSecure(): boolean {
    return this.configService.get<string>('SECURE_COOKIE') === 'true';
  }

  private get cookieSameSite(): 'strict' | 'lax' {
    return this.isCookieSecure ? 'strict' : 'lax';
  }

  @Post('/signup')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @UseGuards(CsrfGuard)
  @ApiOperation({ 
    summary: 'Регистрация нового пользователя',
    description: 'Создаёт нового пользователя и отправляет письмо для подтверждения email. Rate limit: 3 запроса в минуту. Требует CSRF токен.',
  })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Пользователь успешно зарегистрирован. Refresh token установлен в httpOnly cookie.',
    schema: {
      example: {
        username: 'Иван Иванов',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        message: 'На вашу почту отправлено письмо с подтверждением',
      },
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Невалидные данные (валидация)',
    schema: {
      example: {
        statusCode: 400,
        message: ['Введите корректный email'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Невалидный CSRF токен',
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Email уже зарегистрирован',
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Слишком много запросов (3 в минуту)',
  })
  async signUp(@Body() signUpDto: SignUpDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.signUp(signUpDto);
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: this.isCookieSecure,
      sameSite: this.cookieSameSite,
      maxAge: APP_CONFIG.TOKEN.REFRESH_COOKIE_MAX_AGE_MS,
    });
    return {
      username: result.username,
      accessToken: result.accessToken,
      message: 'На вашу почту отправлено письмо с подтверждением',
    };
  }

  @Post('/login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(CsrfGuard)
  @ApiOperation({ 
    summary: 'Вход в систему',
    description: 'Аутентифицирует пользователя и возвращает access token. Refresh token устанавливается в httpOnly cookie. Rate limit: 5 запросов в минуту. Требует CSRF токен.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Успешный вход',
    schema: {
      example: {
        user: {
          email: 'user@example.com',
          username: 'Иван Иванов',
          role: 'Student',
          isEmailVerified: true,
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Неверный email или пароль',
    schema: {
      example: {
        statusCode: 401,
        message: 'Неверный email или пароль',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Невалидный CSRF токен',
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Слишком много запросов (5 в минуту)',
  })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(loginDto);
    if (result.refreshToken) {
      response.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: this.isCookieSecure,
        sameSite: this.cookieSameSite,
        maxAge: APP_CONFIG.TOKEN.REFRESH_COOKIE_MAX_AGE_MS,
      }); 
      delete result.refreshToken;
    }
    return result;
  }

  @Post('/refresh')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(CsrfGuard)
  @ApiCookieAuth()
  @ApiOperation({ 
    summary: 'Обновить access token',
    description: 'Использует refresh token из httpOnly cookie для получения нового access token. Rate limit: 10 запросов в минуту. Требует CSRF токен.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Новый access token',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Refresh token отсутствует или невалиден',
    schema: {
      example: {
        statusCode: 401,
        message: 'Refresh token not found',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Невалидный CSRF токен',
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Слишком много запросов (10 в минуту)',
  })
  async refresh(@Req() request: ExpressRequest, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    const { accessToken } = await this.authService.refreshTokens(refreshToken);
    return { accessToken };
  }

  @Post('/logout')
  @UseGuards(CsrfGuard)
  @ApiCookieAuth()
  @ApiOperation({ 
    summary: 'Выход из системы',
    description: 'Инвалидирует refresh token и очищает cookie. Требует CSRF токен.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Успешный выход',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Невалидный CSRF токен',
  })
  async logout(@Req() request: ExpressRequest, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.refreshToken;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.isCookieSecure,
      sameSite: this.cookieSameSite,
    });
    return { success: true };
  }

  @Get('/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Получить профиль текущего пользователя',
    description: 'Возвращает данные профиля из JWT токена. Требует аутентификации.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Данные профиля',
    schema: {
      example: {
        _id: '64f1a2b3c4d5e6f7g8h9i0j1',
        email: 'user@example.com',
        username: 'Иван Иванов',
        role: 'Student',
        isEmailVerified: true,
        avatar: '/avatars/user_example_com.webp?v=1693123456789',
        createdAt: '2026-08-30T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован (нет или невалидный JWT токен)',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  getProfile(@Request() req) {
    return req.user.toJSON();
  }

  @Post('/verify-email')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ 
    summary: 'Подтвердить email',
    description: 'Подтверждает email пользователя по токену из письма. Rate limit: 5 запросов в минуту.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Токен подтверждения из письма',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
      required: ['token'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email успешно подтверждён',
    schema: {
      example: {
        message: 'Email подтверждён',
      },
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Токен отсутствует или невалиден',
    schema: {
      example: {
        statusCode: 400,
        message: 'Токен обязателен',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Слишком много запросов (5 в минуту)',
  })
  async verifyEmail(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Токен обязателен');
    }
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ 
    summary: 'Запросить сброс пароля',
    description: 'Отправляет письмо с токеном сброса пароля на указанный email. Возвращает одинаковый ответ независимо от существования пользователя (защита от перечисления). Rate limit: 3 запроса в минуту.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          description: 'Email пользователя',
          example: 'user@example.com',
        },
      },
      required: ['email'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Письмо отправлено (если пользователь существует)',
    schema: {
      example: {
        message: 'Если email существует, письмо отправлено',
      },
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Некорректный формат email',
    schema: {
      example: {
        statusCode: 400,
        message: 'Некорректный email',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Слишком много запросов (3 в минуту)',
  })
  async forgotPassword(@Body('email') email: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Некорректный email');
    }
    
    await this.authService.forgotPassword(email.toLowerCase().trim());
    
    return { message: 'Если email существует, письмо отправлено' };
  }

  @Post('/change-password')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Изменить пароль',
    description: 'Изменяет пароль текущего пользователя. Требует знания текущего пароля. Требует JWT аутентификации и CSRF токена.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Пароль успешно изменён',
    schema: {
      example: {
        success: true,
        message: 'Пароль успешно изменён',
      },
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Невалидный новый пароль',
    schema: {
      example: {
        statusCode: 400,
        message: 'Пароль должен содержать минимум 8 символов, заглавные буквы, цифры и специальные символы',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован или неверный текущий пароль',
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Невалидный CSRF токен',
  })
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(req.user._id, dto.oldPassword, dto.newPassword);
    return { success: true, message: 'Пароль успешно изменён' };
  }

  @Post('/reset-password')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ 
    summary: 'Сбросить пароль по токену',
    description: 'Устанавливает новый пароль используя токен из письма. Токен одноразовый и действует ограниченное время. Rate limit: 5 запросов в минуту.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Пароль успешно обновлён',
    schema: {
      example: {
        success: true,
        message: 'Пароль успешно обновлён',
      },
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Невалидный токен или пароль',
    schema: {
      example: {
        statusCode: 400,
        message: 'Токен истёк или невалиден',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Слишком много запросов (5 в минуту)',
  })
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body.token, body.password);
    return { success: true, message: 'Пароль успешно обновлён' };
  }
}