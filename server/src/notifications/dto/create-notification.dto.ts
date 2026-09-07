import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, IsObject } from 'class-validator';
import { NotificationType } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}