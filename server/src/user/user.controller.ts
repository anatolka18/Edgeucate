import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/updateUser.dto';

@Controller('profile')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Body()
    updateUserDto: UpdateUserDto
  ): Promise<User> {
    return this.userService.updateUser(updateUserDto);
  }

  @Get(':username')
  @UseGuards(JwtAuthGuard)
  getUser(
    @Param('username')
    username: string
  ) {
    return this.userService.findByUsername(username);
  }
}