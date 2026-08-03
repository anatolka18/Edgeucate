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
import { APP_CONFIG } from '../common/config/app.config';

@Injectable()
export class AdvertisementService {
  constructor(
    @InjectModel(Advertisement.name)
    private advertisementModel: mongoose.Model<Advertisement>,
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
  ) { }

  async findMyAdvertisements(email: string): Promise<any[]> {
    if (!email || email.trim() === '') {
      throw new BadRequestException('Email не может быть пустым');
    }
    const ads = await this.advertisementModel.find({ email }).lean().exec();
    return ads.map(ad => ({
      ...ad,
      _id: ad._id.toString(),
    }));
  }

  async findAll(page = 1, limit = 20): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.advertisementModel.find().skip(skip).limit(limit).lean().exec(),
      this.advertisementModel.countDocuments(),
    ]);
    
    const serialized = data.map(ad => ({
      ...ad,
      _id: ad._id.toString(),
    }));
    
    return {
      data: serialized,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async search(query: string, subject: string): Promise<Advertisement[]> {
    const filter: any = {};

    if (query) {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { subject: { $regex: escapedQuery, $options: 'i' } },
        { title: { $regex: escapedQuery, $options: 'i' } },
        { creator: { $regex: escapedQuery, $options: 'i' } },
      ];
    }

    if (subject) {
      filter.subject = subject;
    }

    return this.advertisementModel.find(filter).exec();
  }

  async createAdvertisement(createAdvertisementDto: CreateAdvertisementDto): Promise<Advertisement> {
    const user = await this.userModel.findOne({ email: createAdvertisementDto.email });
    if (!user) throw new NotFoundException('Пользователь не найден');
    if (user.role !== 'Teacher') throw new BadRequestException('Только преподаватели могут создавать объявления');

    const advertisementYet = await this.advertisementModel.findOne({
      email: createAdvertisementDto.email,
      subject: createAdvertisementDto.subject
    });
    if (advertisementYet) throw new BadRequestException('Объявление с таким предметом уже существует');

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

  private generateUniqueId(): string {
    return `${new Date().getTime().toString(36)}-${Math.floor(Math.random() * 1000000).toString(36)}`;
  }

  async findByAdvertisementId(advertisementId: string): Promise<{ advertisement: any; feedbacks: any[] }> {
    if (!advertisementId?.trim()) throw new BadRequestException('ID объявления не может быть пустым');
    
    const advertisement = await this.advertisementModel.findOne({ advertisementId }).lean().exec();
    if (!advertisement) throw new NotFoundException('Объявление не найдено');
    
    const user = await this.userModel.findOne({ email: advertisement.email }).lean().exec();
    if (!user) throw new NotFoundException('Пользователь не найден');
    
    const feedbacks = (user.feedback || []).filter(f => f.advertisementId === advertisementId);
    
    return {
      advertisement: {
        ...advertisement,
        _id: advertisement._id.toString(),
      },
      feedbacks,
    };
  }

  async updateAdvertisement(updateAdvertisementDto: UpdateAdvertisementDto): Promise<Advertisement> {
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
    if (!APP_CONFIG.FILE_UPLOAD.ALLOWED_TYPES.includes(type as "svg+xml" | "png" | "jpeg" | "jpg")) {throw new BadRequestException('Поддерживаются только форматы SVG, PNG и JPEG/JPG');}
    if (file.size > APP_CONFIG.FILE_UPLOAD.MAX_SIZE_BYTES) throw new BadRequestException('Размер файла не должен превышать 5 МБ');

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