import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Advertisement } from './schemas/advertisement.schema';
import { MFile, IUploadedFile } from './dto/mfile-class';
import { join } from 'path';
import { access, mkdir, writeFile } from 'fs/promises';
import { CreateAdvertisementDto } from './dto/createAdvertisement.dto';
import { User } from '../user/schemas/user.schema';
import { UpdateAdvertisementDto } from './dto/updateAdvertisement.dto';

@Injectable()
export class AdvertisementService {
  constructor(
    @InjectModel(Advertisement.name)
    private advertisementModel: mongoose.Model<Advertisement>,
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
  ) { }

  async findMyAdvertisements(email: string): Promise<Advertisement[]> {
    if (!email || email.trim() === '') {
      throw new BadRequestException('Email не может быть пустым');
    }
    return this.advertisementModel.find({ email: email });
  }

  async findAll(): Promise<Advertisement[]> {
    return this.advertisementModel.find();
  }

  async searchByQuery(query: string): Promise<Advertisement[]> {
    if (!query || query.trim() === '') {
      throw new BadRequestException('Поисковый запрос не может быть пустым');
    }
    return this.advertisementModel.find({ subject: { $regex: query, $options: 'i' } }).exec();
  }

  async createAdvertisement(createAdvertisementDto: CreateAdvertisementDto): Promise<Advertisement> {
    this.validateCreateAdvertisementDto(createAdvertisementDto);
    const user = await this.userModel.findOne({ email: createAdvertisementDto.email });
    if (!user) throw new NotFoundException('Пользователь не найден');
    if (user.role !== 'Teacher') throw new BadRequestException('Только преподаватели могут создавать объявления');

    const advertisementYet = await this.advertisementModel.findOne({
      email: createAdvertisementDto.email,
      subject: createAdvertisementDto.subject
    });
    if (advertisementYet) throw new BadRequestException('Объявление с таким предметом уже существует');
    if (createAdvertisementDto.price < 0) throw new BadRequestException('Цена не может быть отрицательной');

    let stars = 0;
    let cstars = 0;
    for await (const feed of user.feedback) {
      if (feed.title === createAdvertisementDto.title) {
        stars += feed.stars;
        cstars += 1;
      }
    }
    if (cstars !== 0) stars /= cstars;

    const advertisementId = this.generateUniqueId();
    return this.advertisementModel.create({
      advertisementId,
      title: createAdvertisementDto.title.trim(),
      creator: user.username,
      email: createAdvertisementDto.email,
      subject: createAdvertisementDto.subject.trim(),
      aboutAdvertisement: createAdvertisementDto.aboutAdvertisement.trim(),
      aboutTeacher: user.description,
      avatar: user.avatar,
      price: createAdvertisementDto.price,
      stars,
      date: new Date()
    });
  }

  private validateCreateAdvertisementDto(dto: CreateAdvertisementDto): void {
    if (!dto.email?.trim()) throw new BadRequestException('Email не может быть пустым');
    if (!dto.title?.trim()) throw new BadRequestException('Заголовок не может быть пустым');
    if (!dto.subject?.trim()) throw new BadRequestException('Предмет не может быть пустым');
    if (!dto.aboutAdvertisement?.trim()) throw new BadRequestException('Описание объявления не может быть пустым');
    if (dto.title.length > 100) throw new BadRequestException('Заголовок не должен превышать 100 символов');
    if (dto.subject.length > 50) throw new BadRequestException('Название предмета не должно превышать 50 символов');
    if (dto.aboutAdvertisement.length > 1000) throw new BadRequestException('Описание объявления не должно превышать 1000 символов');
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(dto.email)) throw new BadRequestException('Некорректный формат email');
  }

  private generateUniqueId(): string {
    return `${new Date().getTime().toString(36)}-${Math.floor(Math.random() * 1000000).toString(36)}`;
  }

  async findByAdvertisementId(advertisementId: string): Promise<{ advertisement: Advertisement; feedbacks: any[] }> {
    if (!advertisementId?.trim()) throw new BadRequestException('ID объявления не может быть пустым');
    const advertisement = await this.advertisementModel.findOne({ advertisementId });
    if (!advertisement) throw new NotFoundException('Объявление не найдено');
    const user = await this.userModel.findOne({ email: advertisement.email });
    if (!user) throw new NotFoundException('Пользователь не найден');
    const feedbacks = user.feedback.filter(f => f.advertisementId === advertisementId);
    return { advertisement, feedbacks };
  }

  async updateAdvertisement(updateAdvertisementDto: UpdateAdvertisementDto): Promise<Advertisement> {
    this.validateUpdateAdvertisementDto(updateAdvertisementDto);
    const advertisement = await this.advertisementModel.findOne({ advertisementId: updateAdvertisementDto.advertisementId });
    if (!advertisement) throw new NotFoundException('Объявление не найдено');
    return this.advertisementModel.findOneAndUpdate(
      { advertisementId: updateAdvertisementDto.advertisementId },
      {
        title: updateAdvertisementDto.title.trim(),
        aboutAdvertisement: updateAdvertisementDto.aboutAdvertisement.trim(),
        price: updateAdvertisementDto.price
      },
      { new: true }
    );
  }

  private validateUpdateAdvertisementDto(dto: UpdateAdvertisementDto): void {
    if (!dto.advertisementId?.trim()) throw new BadRequestException('ID объявления не может быть пустым');
    if (!dto.title?.trim()) throw new BadRequestException('Заголовок не может быть пустым');
    if (!dto.aboutAdvertisement?.trim()) throw new BadRequestException('Описание объявления не может быть пустым');
    if (dto.title.length > 100) throw new BadRequestException('Заголовок не должен превышать 100 символов');
    if (dto.aboutAdvertisement.length > 1000) throw new BadRequestException('Описание объявления не должно превышать 1000 символов');
    if (dto.price < 0) throw new BadRequestException('Цена не может быть отрицательной');
  }

  async deleteAdvertisement(advertisementId: string) {
    if (!advertisementId?.trim()) throw new BadRequestException('ID объявления не может быть пустым');
    const advertisement = await this.advertisementModel.findOne({ advertisementId });
    if (!advertisement) throw new NotFoundException('Объявление не найдено');
    return this.advertisementModel.findOneAndDelete({ advertisementId });
  }

  async updateAvatar(name: string, file: IUploadedFile): Promise<Advertisement> {
    if (!name?.trim()) throw new BadRequestException('Имя не может быть пустым');
    if (!file) throw new BadRequestException('Файл не предоставлен');

    const mimetype = file.mimetype;
    const type = mimetype.split('/')[1];
    if (!mimetype.includes('image')) throw new BadRequestException('Файл должен быть изображением');
    if (!['svg+xml', 'png', 'jpeg', 'jpg'].includes(type)) throw new BadRequestException('Поддерживаются только форматы SVG, PNG и JPEG/JPG');
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('Размер файла не должен превышать 5 МБ');

    const advertisement = await this.advertisementModel.findOne({ name });
    if (!advertisement) throw new NotFoundException('Объявление не найдено');

    const newFile = new MFile({ buffer: file.buffer, originalname: `${name}.${type}`, mimetype });
    const uploadFolder = join(__dirname, '..', '..', 'assets', 'advertisements_avatars');
    try { await access(uploadFolder); } catch { await mkdir(uploadFolder, { recursive: true }); }
    try { await writeFile(join(uploadFolder, newFile.originalname), newFile.buffer); } catch { throw new InternalServerErrorException('Ошибка при записи файла'); }

    return this.advertisementModel.findOneAndUpdate({ name }, { avatar: newFile.originalname }, { new: true, runValidators: true });
  }

  async deleteById(id: string) {
    if (!id?.trim()) throw new BadRequestException('ID не может быть пустым');
    if (!mongoose.isValidObjectId(id)) throw new BadRequestException('Некорректный формат ID');
    const advertisement = await this.advertisementModel.findById(id);
    if (!advertisement) throw new NotFoundException('Объявление не найдено');
    return this.advertisementModel.findByIdAndDelete(id);
  }
}