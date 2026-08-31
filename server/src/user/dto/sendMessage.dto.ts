import { IsString, IsNotEmpty, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Email отправителя сообщения. В REST API автоматически устанавливается из JWT токена (не нужно передавать). В WebSocket используется из данных клиента.',
    example: 'sender@example.com',
    format: 'email',
    maxLength: 100,
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  sender: string;

  @ApiProperty({
    description: 'Email получателя сообщения',
    example: 'recipient@example.com',
    format: 'email',
    maxLength: 100,
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  recipient: string;

  @ApiProperty({
    description: 'Текст сообщения. Будет автоматически очищен от HTML через DOMPurify (защита от XSS). Максимум 500 символов.',
    example: 'Привет! Когда можем созвониться для обсуждения занятий?',
    maxLength: 500,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Сообщение не должно превышать 500 символов' })
  message: string;
}