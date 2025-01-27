import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<{ username: string; token: string }> {
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
    });

    const token = this.jwtService.sign({ id: user._id, email: user.email, role: user.role });

    return { username, token };
  }

  async login(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;

    let user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (user.isBlocked) {
      return {
        ...user.toObject(),
        token: '',
        isBlocked: true,
        blockReason: user.blockReason,
      };
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Неверный пароль');
    }

    const token = this.jwtService.sign({ id: user._id, email: user.email, role: user.role });

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
      token,
      isBlocked: user.isBlocked,
      blockReason: user.blockReason,
    };
  }
}