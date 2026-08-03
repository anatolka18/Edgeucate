import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, Notification, NotificationType } from './schemas/user.schema';
import * as mongoose from 'mongoose';

@Injectable()
export class StudentService {
  constructor(
    @InjectModel(User.name) private userModel: mongoose.Model<User>,
  ) {}

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
}