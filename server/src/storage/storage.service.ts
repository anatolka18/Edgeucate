import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';

const sharp = require('sharp');

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private readonly bucketName = 'edgeucate-avatars';
  private readonly maxFileSize = 5 * 1024 * 1024; 

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    this.s3Client = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT || 'http://minio:9000',
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER || '',
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD || '',
      },
      forcePathStyle: true,
    });
  }

  async uploadAvatar(email: string, fileBuffer: Buffer, mimetype: string): Promise<string> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Пользователь не найден');

    if (fileBuffer.length > this.maxFileSize) {
      throw new BadRequestException('Файл не должен превышать 5 МБ');
    }

    if (!mimetype.startsWith('image/')) {
      throw new BadRequestException('Файл должен быть изображением');
    }

    let processedBuffer: Buffer;
    try {
      const image = sharp(fileBuffer);
      const metadata = await image.metadata();

      if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format)) {
        throw new BadRequestException('Поддерживаются только JPEG, PNG и WebP');
      }

      processedBuffer = await image
        .resize(256, 256, { fit: 'cover' })
        .webp({ quality: 85 })
        .toBuffer();
    } catch (error) {
      this.logger.error('Image processing failed', error);
      throw new BadRequestException('Ошибка обработки изображения');
    }

    const sanitizedEmail = email.replace(/[@.]/g, '_');
    const fileKey = `${sanitizedEmail}.webp`;

    if (user.avatar && user.avatar !== 'default.png' && !user.avatar.startsWith('http')) {
      const oldKey = user.avatar.replace('/avatars/', '').split('?')[0];
      await this.deleteFromS3(oldKey);
    }

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
          Body: processedBuffer,
          ContentType: 'image/webp',
        }),
      );
    } catch (error) {
      this.logger.error('Failed to upload to MinIO', error);
      throw new BadRequestException('Ошибка загрузки файла');
    }

    const avatarUrl = `/avatars/${fileKey}?v=${Date.now()}`;
    await this.userModel.findOneAndUpdate({ email }, { avatar: avatarUrl });

    this.logger.log(`Avatar uploaded for ${email}: ${avatarUrl}`);
    return avatarUrl;
  }

  async removeAvatar(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Пользователь не найден');

    if (user.avatar && user.avatar !== 'default.png' && !user.avatar.startsWith('http')) {
      const fileKey = user.avatar.replace('/avatars/', '').split('?')[0];
      await this.deleteFromS3(fileKey);
    }

    await this.userModel.findOneAndUpdate({ email }, { avatar: 'default.png' });
    this.logger.log(`Avatar removed for ${email}`);
  }

  private async deleteFromS3(fileKey: string): Promise<void> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
        }),
      );

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
        }),
      );
    } catch {
    }
  }
}