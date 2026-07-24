import { IsString, IsNotEmpty, MaxLength, IsEmail } from 'class-validator';

export class SendMessageDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  sender: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  recipient: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Сообщение не должно превышать 500 символов' })
  message: string;
}