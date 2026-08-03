import { BadRequestException, Injectable, UnauthorizedException, OnModuleDestroy } from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { RefreshToken } from './schemas/refresh-token.schema';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { Redis } from 'ioredis';
import { APP_CONFIG } from '../common/config/app.config';

@Injectable()
export class AuthService implements OnModuleDestroy {
  private redis: Redis;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshToken>,
    private jwtService: JwtService,
    @InjectQueue('email') private emailQueue: Queue,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async signUp(signUpDto: SignUpDto): Promise<{ username: string; accessToken: string; refreshToken: string }> {
    const { username, password, email, role } = signUpDto;

    if (await this.userModel.findOne({ username })) {
      throw new BadRequestException('Такой никнейм уже занят.');
    }

    if (username.includes('@') || username.includes('.'))
      throw new BadRequestException('В никнейме не должно быть символов . и @');

    if (await this.userModel.findOne({ email })) {
      throw new BadRequestException('Такой адрес электронный почты уже занят.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      username,
      password: hashedPassword,
      email,
      role,
      avatar: 'default.png',
      description: 'Ваше описание...',
      courses: [],
      chat: [],
      feedback: [],
      notifications: [],
      students: [],
      online: false,
      dateLastOnline: new Date(),
      isVerified: false,
    });

    const token = crypto.randomBytes(32).toString('hex');
    await this.redis.set(`verify:email:${token}`, email, 'EX', APP_CONFIG.TOKEN.VERIFY_EMAIL_TTL_SECONDS);

    await this.emailQueue.add('send-verification', { email, token, type: 'verify' });

    const tokens = await this.generateTokens(user);
    return { username: user.username, ...tokens };
  }

  async login(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Подтвердите email, чтобы войти');
    }

    if (user.isBlocked) {
      return {
        ...user.toObject(),
        accessToken: null,
        refreshToken: null,
        isBlocked: true,
        blockReason: user.blockReason,
      };
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Неверный пароль');
    }

    const tokens = await this.generateTokens(user);

    return {
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      courses: user.courses,
      feedback: user.feedback,
      description: user.description,
      notifications: user.notifications,
      chat: user.chat,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isBlocked: user.isBlocked,
      blockReason: user.blockReason,
    };
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string }> {
    const tokenDoc = await this.refreshTokenModel.findOne({ token: refreshToken });
    if (!tokenDoc || tokenDoc.expires < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.userModel.findOne({ email: tokenDoc.email });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { id: (user as any)._id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '5m' });

    return { accessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenModel.deleteOne({ token: refreshToken });
  }

  async verifyEmail(token: string): Promise<{ success: boolean }> {
    const email = await this.redis.get(`verify:email:${token}`);
    if (!email) {
      throw new BadRequestException('Токен недействителен или истёк');
    }

    await this.userModel.findOneAndUpdate({ email }, { isVerified: true });
    await this.redis.del(`verify:email:${token}`);

    return { success: true };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    await this.redis.set(`reset:password:${token}`, email, 'EX', APP_CONFIG.TOKEN.RESET_PASSWORD_TTL_SECONDS);

    await this.emailQueue.add('send-reset', { email, token, type: 'reset' });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const email = await this.redis.get(`reset:password:${token}`);
    if (!email) {
      throw new BadRequestException('Токен недействителен или истёк');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userModel.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );

    await this.redis.del(`reset:password:${token}`);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('Пользователь не найден');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('Неверный старый пароль');

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    await this.refreshTokenModel.deleteMany({ email: user.email });
  }

  private async generateTokens(user: User) {
    await this.refreshTokenModel.deleteMany({ email: user.email });

    const payload = { id: (user as any)._id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '5m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.refreshTokenModel.create({
      token: refreshToken,
      email: user.email,
      expires: new Date(Date.now() + APP_CONFIG.TOKEN.REFRESH_COOKIE_MAX_AGE_MS),
    });

    return { accessToken, refreshToken };
  }
}