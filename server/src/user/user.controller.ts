import { Controller, Get, Put, Body, Param, UseGuards, Post, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CsrfGuard } from '../guards/csrf.guard';
import { Roles } from '../guards/roles.decorator';
import { Role } from './schemas/user.schema';
import { UpdateUserDto } from './dto/updateUser.dto';

@Controller('profile')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.userService.findAll();
  }

  @Put()
  @UseGuards(JwtAuthGuard, CsrfGuard)
  updateProfile(@Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.userService.updateUser(updateUserDto);
  }

  @Get(':username')
  @UseGuards(JwtAuthGuard)
  getUser(@Param('username') username: string) {
    return this.userService.findByUsername(username);
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async getMessages(
    @Body('sender') senderEmail: string,
    @Body('recipient') recipientEmail: string,
  ) {
    if (!senderEmail || !recipientEmail) {
      throw new BadRequestException('Оба email обязательны.');
    }
    return this.userService.getMessages(senderEmail, recipientEmail);
  }

  @Post('chats')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async getChats(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return await this.userService.getChats(email);
  }

  @Post('student/add')
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(Role.TEACHER)
  async addStudent(
    @Body('teacherEmail') teacherEmail: string,
    @Body('studentEmail') studentEmail: string
  ) {
    if (!teacherEmail || !studentEmail) {
      throw new BadRequestException('Teacher email and student email are required');
    }
    return this.userService.addStudent(teacherEmail, studentEmail);
  }

  @Post('student/remove')
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(Role.TEACHER)
  async removeStudent(
    @Body('teacherEmail') teacherEmail: string,
    @Body('studentEmail') studentEmail: string
  ) {
    if (!teacherEmail || !studentEmail) {
      throw new BadRequestException('Teacher email and student email are required');
    }
    return this.userService.removeStudent(teacherEmail, studentEmail);
  }

  @Post('student/check')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async checkIfStudent(
    @Body('teacherEmail') teacherEmail: string,
    @Body('studentEmail') studentEmail: string
  ) {
    if (!teacherEmail || !studentEmail) {
      throw new BadRequestException('Teacher email and student email are required');
    }
    return {
      isStudent: await this.userService.checkIfStudent(teacherEmail, studentEmail)
    };
  }
}