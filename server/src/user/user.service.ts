import { Injectable, NotFoundException } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { RefreshToken } from '../auth/schemas/refresh-token.schema';
import { UpdateUserDto } from './dto/updateUser.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: mongoose.Model<User>,
    @InjectModel(RefreshToken.name) private refreshTokenModel: mongoose.Model<RefreshToken>,
  ) {}

  async findAll(page = 1, limit = 20): Promise<{ data: User[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel.find().skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(),
    ]);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(updateUserDto: UpdateUserDto): Promise<User> {
    return this.userModel.findOneAndUpdate(
      { email: updateUserDto.email },
      { description: updateUserDto.description },
      { new: true },
    );
  }

  async blockUser(email: string, isBlocked: boolean, blockReason?: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Пользователь не найден');

    user.isBlocked = isBlocked;
    user.blockReason = isBlocked ? blockReason || '' : '';
    await user.save();

    if (isBlocked) {
      await this.refreshTokenModel.deleteMany({ email });
    }

    return user;
  }
}