import { Controller, Get, Post, Body, Request, UseGuards, Res, Req, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Response, Request as ExpressRequest } from 'express';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async signUp(@Body() signUpDto: SignUpDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.signUp(signUpDto);
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { 
      username: result.username, 
      accessToken: result.accessToken,
      message: 'На вашу почту отправлено письмо с подтверждением' 
    };
  }

  @Post('/login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(loginDto);
    if (result.refreshToken) {
      response.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      delete result.refreshToken;
    }
    return result;
  }

  @Post('/refresh')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async refresh(@Req() request: ExpressRequest, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    const { accessToken } = await this.authService.refreshTokens(refreshToken);
    return { accessToken };
  }

  @Post('/logout')
  async logout(@Req() request: ExpressRequest, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.refreshToken;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    response.clearCookie('refreshToken');
    return { success: true };
  }

  @Get('/profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    const { password, ...user } = req.user.toObject();
    return user;
  }

  @Post('/verify-email')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async verifyEmail(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Токен обязателен');
    }
    return this.authService.verifyEmail(token);
  }

  @Post('/forgot-password')
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  async forgotPassword(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email обязателен');
    }
    await this.authService.forgotPassword(email);
    return { success: true, message: 'Если аккаунт существует, письмо отправлено' };
  }

  @Post('/reset-password')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async resetPassword(@Body() body: { token: string; password: string }) {
    if (!body.token || !body.password) {
      throw new BadRequestException('Токен и пароль обязательны');
    }
    if (body.password.length < 6) {
      throw new BadRequestException('Пароль должен быть не менее 6 символов');
    }
    await this.authService.resetPassword(body.token, body.password);
    return { success: true, message: 'Пароль успешно обновлён' };
  }
}