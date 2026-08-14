import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('storage')
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    const email = req.user.email;
    const avatarUrl = await this.storageService.uploadAvatar(
      email,
      file.buffer,
      file.mimetype,
    );

    return { avatarUrl };
  }

  @Delete('avatar')
  @UseGuards(JwtAuthGuard)
  async removeAvatar(@Req() req: any) {
    const email = req.user.email;
    await this.storageService.removeAvatar(email);
    return { success: true };
  }
}