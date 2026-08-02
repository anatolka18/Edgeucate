import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, Notification, NotificationType } from './schemas/user.schema';
import { RefreshToken } from '../auth/schemas/refresh-token.schema';
import { UpdateUserDto } from './dto/updateUser.dto';
import { SendMessageDto } from './dto/sendMessage.dto';
import { MessageService } from '../message/message.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: mongoose.Model<User>,
    @InjectModel(RefreshToken.name) private refreshTokenModel: mongoose.Model<RefreshToken>,
    private messageService: MessageService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find();
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

  async sendMessage(dto: SendMessageDto) {
    return this.messageService.sendMessage(dto);
  }

  async getMessages(senderEmail: string, recipientEmail: string) {
    return this.messageService.getMessages(senderEmail, recipientEmail);
  }

  async getChats(email: string) {
    return this.messageService.getChats(email);
  }

  async editMessage(messageId: string, senderEmail: string, newText: string) {
    return this.messageService.editMessage(messageId, senderEmail, newText);
  }

  async deleteMessage(messageId: string, senderEmail: string) {
    return this.messageService.deleteMessage(messageId, senderEmail);
  }

  async markMessagesAsRead(readerEmail: string, fromEmail: string) {
    return this.messageService.markMessagesAsRead(readerEmail, fromEmail);
  }

  async online(email: string) {
    await this.userModel.findOneAndUpdate({ email }, { online: true, dateLastOnline: new Date() });
  }

  async offline(email: string) {
    await this.userModel.findOneAndUpdate({ email }, { online: false, dateLastOnline: new Date() });
  }

  async getUsersByEmails(emails: string[]): Promise<{ email: string; online: boolean }[]> {
    const users = await this.userModel.find(
      { email: { $in: emails } },
      { email: 1, online: 1 }
    ).lean();
    return users;
  }

  async addStudent(teacherEmail: string, studentEmail: string): Promise<User> {
    const teacher = await this.userModel.findOne({ email: teacherEmail });
    if (!teacher) {
      throw new NotFoundException('Преподаватель не найден');
    }

    const student = await this.userModel.findOne({ email: studentEmail });
    if (!student) {
      throw new NotFoundException('Студент не найден');
    }

    if (teacher.students && teacher.students.includes(studentEmail)) {
      throw new BadRequestException('Этот пользователь уже добавлен в список учеников');
    }

    const notification: Notification = {
      type: NotificationType.AcceptFriend,
      text: `${teacher.username} добавил вас в список учеников`,
      checked: false,
      date: new Date()
    };

    await this.userModel.updateOne(
      { email: studentEmail },
      { $push: { notifications: notification } }
    );

    return this.userModel.findOneAndUpdate(
      { email: teacherEmail },
      { $push: { students: studentEmail } },
      { new: true }
    );
  }

  async removeStudent(teacherEmail: string, studentEmail: string): Promise<User> {
    const teacher = await this.userModel.findOne({ email: teacherEmail });
    if (!teacher) {
      throw new NotFoundException('Преподаватель не найден');
    }

    return this.userModel.findOneAndUpdate(
      { email: teacherEmail },
      { $pull: { students: studentEmail } },
      { new: true }
    );
  }

  async checkIfStudent(teacherEmail: string, studentEmail: string): Promise<boolean> {
    const teacher = await this.userModel.findOne({ email: teacherEmail });
    if (!teacher || !teacher.students) {
      return false;
    }

    return teacher.students.includes(studentEmail);
  }

  async getUnreadCount(recipientEmail: string, senderEmail: string): Promise<number> {
    return this.messageService.getUnreadCount(recipientEmail, senderEmail);
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