import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User, Feedback } from '../user/schemas/user.schema';
import { Advertisement } from '../advertisement/schemas/advertisement.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { PrometheusService } from '../prometheus/prometheus.service';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
    @InjectModel(Advertisement.name)
    private advertisementModel: mongoose.Model<Advertisement>,
    @InjectConnection()
    private connection: mongoose.Connection,
    private prometheusService: PrometheusService,
  ) {}

  async createFeedback(createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
    const { advertisementId, studentEmail, teacherEmail, text, title, stars } = createFeedbackDto;

    if (stars < 1 || stars > 5) {
      throw new BadRequestException('Оценка должна быть от 1 до 5');
    }

    const advertisement = await this.advertisementModel.findOne({ advertisementId });
    if (!advertisement) throw new NotFoundException('Объявление не найдено');

    const student = await this.userModel.findOne({ email: studentEmail });
    if (!student) throw new NotFoundException('Студент не найден');

    const teacher = await this.userModel.findOne({ email: teacherEmail });
    if (!teacher) throw new NotFoundException('Преподаватель не найден');

    if (!teacher.students || !teacher.students.includes(studentEmail)) {
      throw new BadRequestException('Только ученики преподавателя могут оставлять отзывы');
    }

    const existingFeedback = teacher.feedback.find(
      f => f.advertisementId === advertisementId && f.username === student.username
    );

    if (existingFeedback) throw new BadRequestException('Вы уже оставили отзыв на это объявление');

    const newFeedback: Feedback = {
      advertisementId,
      username: student.username,
      text,
      title: title || advertisement.title,
      stars,
      date: new Date()
    };

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await this.userModel.findOneAndUpdate(
        { email: teacherEmail },
        { $push: { feedback: newFeedback } },
        { session }
      );

      const updatedTeacher = await this.userModel.findOne({ email: teacherEmail }).session(session);
      let totalStars = 0;
      let feedbackCount = 0;

      updatedTeacher.feedback.forEach(feedback => {
        if (feedback.advertisementId === advertisementId) {
          totalStars += feedback.stars;
          feedbackCount++;
        }
      });

      const averageStars = feedbackCount > 0 ? totalStars / feedbackCount : 0;

      await this.advertisementModel.findOneAndUpdate(
        { advertisementId },
        { stars: averageStars },
        { session }
      );

      await session.commitTransaction();

      this.prometheusService.incrementReviewSubmitted(stars.toString());

      return newFeedback;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getUserFeedbacks(email: string): Promise<Feedback[]> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user.feedback;
  }

  async canStudentLeaveFeedback(
    teacherEmail: string,
    studentEmail: string,
    advertisementId: string
  ): Promise<{ canLeaveFeedback: boolean; reason?: string }> {
    const advertisement = await this.advertisementModel.findOne({ advertisementId });
    if (!advertisement) return { canLeaveFeedback: false, reason: 'Объявление не найдено' };
    if (advertisement.email !== teacherEmail) return { canLeaveFeedback: false, reason: 'Объявление принадлежит другому преподавателю' };

    const teacher = await this.userModel.findOne({ email: teacherEmail });
    if (!teacher) return { canLeaveFeedback: false, reason: 'Преподаватель не найден' };

    const student = await this.userModel.findOne({ email: studentEmail });
    if (!student) return { canLeaveFeedback: false, reason: 'Студент не найден' };

    if (!teacher.students || !teacher.students.includes(studentEmail)) {
      return { canLeaveFeedback: false, reason: 'Только ученики преподавателя могут оставлять отзывы' };
    }

    const existingFeedback = teacher.feedback.find(
      f => f.advertisementId === advertisementId && f.username === student.username
    );

    if (existingFeedback) return { canLeaveFeedback: false, reason: 'Вы уже оставили отзыв на это объявление' };

    return { canLeaveFeedback: true };
  }

  async deleteFeedback(
    teacherEmail: string,
    feedbackUsername: string,
    advertisementId: string
  ): Promise<boolean> {
    const teacher = await this.userModel.findOne({ email: teacherEmail });
    if (!teacher) throw new NotFoundException('Преподаватель не найден');

    const feedbackIndex = teacher.feedback.findIndex(
      f => f.advertisementId === advertisementId && f.username === feedbackUsername
    );

    if (feedbackIndex === -1) throw new NotFoundException('Отзыв не найден');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      teacher.feedback.splice(feedbackIndex, 1);
      await teacher.save({ session });

      const relevantFeedbacks = teacher.feedback.filter(f => f.advertisementId === advertisementId);
      let totalStars = 0;
      relevantFeedbacks.forEach(feedback => { totalStars += feedback.stars; });
      const averageStars = relevantFeedbacks.length > 0 ? totalStars / relevantFeedbacks.length : 0;

      await this.advertisementModel.findOneAndUpdate(
        { advertisementId },
        { stars: averageStars },
        { session }
      );

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}