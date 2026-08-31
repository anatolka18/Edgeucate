import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AdvertisementService } from './advertisement.service';
import { Advertisement } from './schemas/advertisement.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CsrfGuard } from '../guards/csrf.guard';
import { Roles } from '../guards/roles.decorator';
import { Role } from '../user/schemas/user.schema';
import { CreateAdvertisementDto } from './dto/createAdvertisement.dto';
import { UpdateAdvertisementDto } from './dto/updateAdvertisement.dto';

@ApiTags('advertisements')
@Controller('advertisement')
export class AdvertisementController {
  constructor(private advertisementService: AdvertisementService) { }

  @Post('/my')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Получить мои объявления',
    description: 'Возвращает список объявлений текущего пользователя (по email из JWT токена). Требует аутентификации и CSRF токена.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список объявлений пользователя',
    schema: {
      example: [
        {
          _id: '64f1a2b3c4d5e6f7g8h9i0j1',
          title: 'Репетитор по математике для ЕГЭ',
          subject: 'Mathematics',
          aboutAdvertisement: 'Опытный преподаватель с 10-летним стажем...',
          email: 'teacher@example.com',
          price: 1500,
          createdAt: '2026-08-30T12:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован (нет или невалидный JWT токен)',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Невалидный CSRF токен',
  })
  getMyAdvertisement(@Request() req) {
    return this.advertisementService.findMyAdvertisements(req.user.email);
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Поиск объявлений',
    description: 'Полнотекстовый поиск по заголовку, описанию и предмету. Публичный endpoint.',
  })
  @ApiQuery({ 
    name: 'query', 
    required: false, 
    description: 'Поисковый запрос',
    example: 'ЕГЭ математика',
  })
  @ApiQuery({ 
    name: 'subject', 
    required: false, 
    description: 'Фильтр по предмету',
    example: 'Mathematics',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Найденные объявления',
    schema: {
      example: [
        {
          _id: '64f1a2b3c4d5e6f7g8h9i0j1',
          title: 'Репетитор по математике для ЕГЭ',
          subject: 'Mathematics',
          price: 1500,
          avatar: '/avatars/teacher_example_com.webp?v=1693123456789',
          creator: {
            email: 'teacher@example.com',
            name: 'Иван Иванов',
            avatar: '/avatars/teacher_example_com.webp?v=1693123456789',
          },
        },
      ],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Ничего не найдено (пустой массив)',
    schema: {
      example: [],
    },
  })
  searchAdvertisements(
    @Query('query') query: string,
    @Query('subject') subject: string,
  ) {
    return this.advertisementService.search(query || '', subject || '');
  }

  @Get()
  @ApiOperation({ 
    summary: 'Получить все объявления (с пагинацией)',
    description: 'Возвращает список активных объявлений с пагинацией. Публичный endpoint.',
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Номер страницы (default: 1)',
    example: 1,
    type: Number,
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Количество объявлений на странице (default: 20, max: 100)',
    example: 20,
    type: Number,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список объявлений',
    schema: {
      example: {
        items: [
          {
            _id: '64f1a2b3c4d5e6f7g8h9i0j1',
            title: 'Репетитор по математике для ЕГЭ',
            subject: 'Mathematics',
            price: 1500,
            creator: {
              email: 'teacher@example.com',
              name: 'Иван Иванов',
              avatar: '/avatars/teacher_example_com.webp?v=1693123456789',
            },
          },
        ],
        total: 150,
        page: 1,
        limit: 20,
      },
    },
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.advertisementService.findAll(
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  @Put('/update')
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Обновить объявление',
    description: 'Обновляет существующее объявление. Доступно только пользователям с ролью TEACHER. Требует JWT аутентификации, роли и CSRF токена.',
  })
  @ApiBody({ type: UpdateAdvertisementDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Объявление успешно обновлено',
    schema: {
      example: {
        _id: '64f1a2b3c4d5e6f7g8h9i0j1',
        title: 'Репетитор по математике для ЕГЭ и ОГЭ',
        subject: 'Mathematics',
        aboutAdvertisement: 'Обновлённое описание...',
        email: 'teacher@example.com',
        price: 1800,
        updatedAt: '2026-08-30T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Невалидные данные (валидация)',
    schema: {
      example: {
        statusCode: 400,
        message: ['Заголовок не может быть пустым'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован',
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Нет прав (нужна роль TEACHER или невалидный CSRF токен)',
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Объявление не найдено',
  })
  updateAdvertisement(@Body() updateAdvertisementDto: UpdateAdvertisementDto): Promise<Advertisement> {
    return this.advertisementService.updateAdvertisement(updateAdvertisementDto);
  }

  @Get(':advertisementId')
  @ApiOperation({ 
    summary: 'Получить объявление по ID',
    description: 'Возвращает одно объявление с полными данными (включая информацию о создателе). Публичный endpoint.',
  })
  @ApiParam({ 
    name: 'advertisementId', 
    description: 'MongoDB ObjectId объявления',
    example: '64f1a2b3c4d5e6f7g8h9i0j1',
    type: String,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Объявление найдено',
    schema: {
      example: {
        _id: '64f1a2b3c4d5e6f7g8h9i0j1',
        title: 'Репетитор по математике для ЕГЭ',
        subject: 'Mathematics',
        aboutAdvertisement: 'Опытный преподаватель с 10-летним стажем...',
        email: 'teacher@example.com',
        price: 1500,
        createdAt: '2026-08-30T12:00:00.000Z',
        creator: {
          email: 'teacher@example.com',
          name: 'Иван Иванов',
          avatar: '/avatars/teacher_example_com.webp?v=1693123456789',
          aboutTeacher: 'Кандидат физико-математических наук',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Объявление не найдено',
    schema: {
      example: {
        statusCode: 404,
        message: 'Объявление не найдено',
        error: 'Not Found',
      },
    },
  })
  getAdvertisement(@Param('advertisementId') advertisementId: string) {
    return this.advertisementService.findByAdvertisementId(advertisementId);
  }

  @Post('/create')
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Создать объявление',
    description: 'Создаёт новое объявление репетитора. Доступно только пользователям с ролью TEACHER. Требует JWT аутентификации, роли и CSRF токена.',
  })
  @ApiBody({ type: CreateAdvertisementDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Объявление успешно создано',
    schema: {
      example: {
        _id: '64f1a2b3c4d5e6f7g8h9i0j1',
        title: 'Репетитор по математике для ЕГЭ',
        subject: 'Mathematics',
        aboutAdvertisement: 'Опытный преподаватель с 10-летним стажем...',
        email: 'teacher@example.com',
        price: 1500,
        createdAt: '2026-08-30T12:00:00.000Z',
        creator: {
          email: 'teacher@example.com',
          name: 'Иван Иванов',
          avatar: '/avatars/teacher_example_com.webp?v=1693123456789',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Невалидные данные (валидация)',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Заголовок не должен превышать 100 символов',
          'Цена не может быть отрицательной',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован',
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Нет прав (нужна роль TEACHER или невалидный CSRF токен)',
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Объявление уже существует для этого пользователя',
  })
  async createAdvertisement(@Body() createAdvertisementDto: CreateAdvertisementDto) {
    return this.advertisementService.createAdvertisement(createAdvertisementDto);
  }

  @Delete(':advertisementId')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Удалить объявление',
    description: 'Удаляет объявление по ID. Доступно только владельцу объявления. Требует JWT аутентификации и CSRF токена.',
  })
  @ApiParam({ 
    name: 'advertisementId', 
    description: 'MongoDB ObjectId объявления для удаления',
    example: '64f1a2b3c4d5e6f7g8h9i0j1',
    type: String,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Объявление успешно удалено',
    schema: {
      example: {
        message: 'Объявление удалено',
        deletedId: '64f1a2b3c4d5e6f7g8h9i0j1',
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован',
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Нет прав (не владелец или невалидный CSRF токен)',
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Объявление не найдено',
  })
  async deleteAdvertisement(@Param('advertisementId') advertisementId: string) {
    return this.advertisementService.deleteAdvertisement(advertisementId);
  }
}