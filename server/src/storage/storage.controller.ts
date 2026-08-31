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
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiConsumes, 
  ApiBody 
} from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Загрузить аватар пользователя',
    description: 'Загружает изображение аватара для текущего пользователя (из JWT токена). Изображение автоматически: 1) валидируется (только JPEG/PNG/WebP, макс. 5MB), 2) ресайзится до 256x256, 3) конвертируется в WebP формат, 4) сохраняется в MinIO с cache busting через ?v=timestamp. Требует JWT аутентификации.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Файл изображения (JPEG, PNG или WebP, макс. 5MB)',
        },
      },
      required: ['avatar'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Аватар успешно загружен',
    schema: {
      example: {
        avatarUrl: '/avatars/user_example_com.webp?v=1693123456789',
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Аватар успешно загружен',
    schema: {
      example: {
        avatarUrl: '/avatars/user_example_com.webp?v=1693123456789',
      },
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Файл не предоставлен или невалидный формат',
    schema: {
      examples: {
        noFile: {
          summary: 'Файл не предоставлен',
          value: {
            statusCode: 400,
            message: 'Файл не предоставлен',
            error: 'Bad Request',
          },
        },
        invalidFormat: {
          summary: 'Невалидный формат файла',
          value: {
            statusCode: 400,
            message: 'Поддерживаются только форматы JPEG, PNG и WebP',
            error: 'Bad Request',
          },
        },
        tooLarge: {
          summary: 'Файл слишком большой',
          value: {
            statusCode: 400,
            message: 'Размер файла не должен превышать 5MB',
            error: 'Bad Request',
          },
        },
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Ошибка загрузки в MinIO',
  })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Удалить аватар пользователя',
    description: 'Удаляет аватар текущего пользователя (из JWT токена) из MinIO и сбрасывает URL в default.png. Если аватара нет — операция всё равно успешна. Требует JWT аутентификации.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Аватар успешно удалён',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Аватар не найден (не был загружен)',
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Ошибка удаления из MinIO',
  })
  async removeAvatar(@Req() req: any) {
    const email = req.user.email;
    await this.storageService.removeAvatar(email);
    return { success: true };
  }
}