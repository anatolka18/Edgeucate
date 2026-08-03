import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import * as mongoose from 'mongoose';

@Injectable()
export class PresenceService {
  constructor(
    @InjectModel(User.name) private userModel: mongoose.Model<User>,
  ) {}

  async online(email: string) {
    await this.userModel.findOneAndUpdate(
      { email },
      { online: true, dateLastOnline: new Date() }
    );
  }

  async offline(email: string) {
    await this.userModel.findOneAndUpdate(
      { email },
      { online: false, dateLastOnline: new Date() }
    );
  }

  async getUsersByEmails(emails: string[]): Promise<{ email: string; online: boolean }[]> {
    const users = await this.userModel.find(
      { email: { $in: emails } },
      { email: 1, online: 1 }
    ).lean();
    return users;
  }
}