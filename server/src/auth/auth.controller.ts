import { Controller, Get, Post, Body, Request, UseGuards, Res, Req, UnauthorizedException, BadRequestException } from '@nestjs/common';
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
  getProfile(@Request() req) {
    return req.user.toJSON();
  }

  @Post('/verify-email')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(CsrfGuard)
  async verifyEmail(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Токен обязателен');
    }
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  @UseGuards(CsrfGuard)
  async forgotPassword(@Body('email') email: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Некорректный email');
    }
    
    await this.authService.forgotPassword(email.toLowerCase().trim());
    
    return { message: 'Если email существует, письмо отправлено' };
  }

  @Post('/change-password')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(req.user._id, dto.oldPassword, dto.newPassword);
    return { success: true, message: 'Пароль успешно изменён' };
  }

  @Post('/reset-password')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(CsrfGuard)
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body.token, body.password);
    return { success: true, message: 'Пароль успешно обновлён' };
  }
}