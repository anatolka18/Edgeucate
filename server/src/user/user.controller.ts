import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
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
  @UseGuards(JwtAuthGuard)
  updateProfile(@Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.userService.updateUser(updateUserDto);
  }

  @Get(':username')
  @UseGuards(JwtAuthGuard)
  getUser(@Param('username') username: string) {
    return this.userService.findByUsername(username);
  }
}