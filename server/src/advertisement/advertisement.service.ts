import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Advertisement } from './schemas/advertisement.schema';
import { CreateAdvertisementDto } from './dto/createAdvertisement.dto';
import { User } from '../user/schemas/user.schema';
import { UpdateAdvertisementDto } from './dto/updateAdvertisement.dto';
import { PrometheusService } from '../prometheus/prometheus.service';

@Injectable()
export class AdvertisementService {
  constructor(
    @InjectModel(Advertisement.name)
    private advertisementModel: mongoose.Model<Advertisement>,
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
    private prometheusService: PrometheusService,
  ) { }

  private async enrichWithAvatar(ads: any[]): Promise<any[]> {
    if (ads.length === 0) return [];

    const emails = [...new Set(ads.map(ad => ad.email).filter(Boolean))];
    if (emails.length === 0) return ads;

    const users = await this.userModel.find(
      { email: { $in: emails } },
      { email: 1, avatar: 1, username: 1, description: 1 },
    ).lean().exec();

    const userMap = new Map(users.map(u => [u.email, u]));

    return ads.map(ad => {
      const user = userMap.get(ad.email);
      return {
        ...ad,
        _id: ad._id?.toString?.() ?? ad._id,
        avatar: user?.avatar || ad.avatar || 'default.png',
        creator: user?.username || ad.creator,
        aboutTeacher: user?.description || ad.aboutTeacher,
      };
    });
  }

  async findMyAdvertisements(email: string): Promise<any[]> {
    if (!email || email.trim() === '') {
      throw new BadRequestException('Email не может быть пустым');
    }
    const ads = await this.advertisementModel.find({ email }).lean().exec();
    return this.enrichWithAvatar(ads);
  }

  async findAll(page = 1, limit = 20): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.advertisementModel.find().skip(skip).limit(limit).lean().exec(),
      this.advertisementModel.countDocuments(),
    ]);

    const serialized = await this.enrichWithAvatar(data);

    return {
      data: serialized,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async search(query: string, subject: string): Promise<any[]> {
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
      this.prometheusService.incrementSearchQuery(subject);
    }

    const ads = await this.advertisementModel.find(filter).lean().exec();
    return this.enrichWithAvatar(ads);
  }

  async createAdvertisement(createAdvertisementDto: CreateAdvertisementDto): Promise<any> {
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
    const created = await this.advertisementModel.create({
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

    this.prometheusService.incrementAdvertisementCreated(createAdvertisementDto.subject.trim());

    const enriched = await this.enrichWithAvatar([created.toObject()]);
    return enriched[0];
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
        avatar: user.avatar || advertisement.avatar || 'default.png',
        creator: user.username || advertisement.creator,
        aboutTeacher: user.description || advertisement.aboutTeacher,
      },
      feedbacks,
    };
  }

  async updateAdvertisement(updateAdvertisementDto: UpdateAdvertisementDto): Promise<any> {
    const advertisement = await this.advertisementModel.findOne({ advertisementId: updateAdvertisementDto.advertisementId });
    if (!advertisement) throw new NotFoundException('Объявление не найдено');

    const updated = await this.advertisementModel.findOneAndUpdate(
      { advertisementId: updateAdvertisementDto.advertisementId },
      {
        title: updateAdvertisementDto.title.trim(),
        aboutAdvertisement: updateAdvertisementDto.aboutAdvertisement.trim(),
        price: updateAdvertisementDto.price
      },
      { new: true }
    );

    const enriched = await this.enrichWithAvatar([updated.toObject()]);
    return enriched[0];
  }

  async deleteAdvertisement(advertisementId: string) {
    if (!advertisementId?.trim()) throw new BadRequestException('ID объявления не может быть пустым');
    const advertisement = await this.advertisementModel.findOne({ advertisementId });
    if (!advertisement) throw new NotFoundException('Объявление не найдено');
    return this.advertisementModel.findOneAndDelete({ advertisementId });
  }

  async deleteById(id: string) {
    if (!id?.trim()) throw new BadRequestException('ID не может быть пустым');
    if (!mongoose.isValidObjectId(id)) throw new BadRequestException('Некорректный формат ID');
    const advertisement = await this.advertisementModel.findById(id);
    if (!advertisement) throw new NotFoundException('Объявление не найдено');
    return this.advertisementModel.findByIdAndDelete(id);
  }
}