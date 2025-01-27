import { Controller, Post, Get, Body, Param, UseGuards, Delete, Request, ForbiddenException } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Role } from '../user/schemas/user.schema';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createFeedback(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(createFeedbackDto);
  }

  @Get('user/:email')
  async getUserFeedbacks(@Param('email') email: string) {
    return this.feedbackService.getUserFeedbacks(email);
  }

  @Post('can-leave')
  @UseGuards(JwtAuthGuard)
  async canStudentLeaveFeedback(
    @Body('teacherEmail') teacherEmail: string,
    @Body('studentEmail') studentEmail: string,
    @Body('advertisementId') advertisementId: string,
  ) {
    return this.feedbackService.canStudentLeaveFeedback(teacherEmail, studentEmail, advertisementId);
  }

  @Delete('delete/:teacherEmail/:advertisementId/:username')
  @UseGuards(JwtAuthGuard)
  async deleteFeedback(
    @Request() req,
    @Param('teacherEmail') teacherEmail: string,
    @Param('advertisementId') advertisementId: string,
    @Param('username') username: string,
  ) {
    const currentUser = req.user;
    
    if (currentUser.role !== Role.ADMIN && currentUser.username !== username) {
      throw new ForbiddenException('Вы не можете удалить этот отзыв');
    }

    return this.feedbackService.deleteFeedback(teacherEmail, username, advertisementId);
  }
}