import { IsString, IsNumber, IsNotEmpty, Min, MaxLength, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdvertisementDto {
  @ApiProperty({
    description: 'Заголовок объявления',
    example: 'Репетитор по математике для ЕГЭ',
    maxLength: 100,
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Заголовок не может быть пустым' })
  @MaxLength(100, { message: 'Заголовок не должен превышать 100 символов' })
  title: string;

  @ApiProperty({
    description: 'Предмет преподавания',
    example: 'Mathematics',
    maxLength: 50,
    required: true,
    enum: ['Mathematics', 'Physics', 'English', 'Chemistry', 'Biology', 'History'],
  })
  @IsString()
  @IsNotEmpty({ message: 'Предмет не может быть пустым' })
  @MaxLength(50, { message: 'Предмет не должен превышать 50 символов' })
  subject: string;

  @ApiProperty({
    description: 'Подробное описание объявления',
    example: 'Опытный преподаватель с 10-летним стажем. Помогу подготовиться к ЕГЭ по математике на 90+ баллов. Индивидуальный подход к каждому ученику.',
    maxLength: 1000,
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Описание не может быть пустым' })
  @MaxLength(1000, { message: 'Описание не должно превышать 1000 символов' })
  aboutAdvertisement: string;

  @ApiProperty({
    description: 'Email учителя',
    example: 'teacher@example.com',
    format: 'email',
    maxLength: 100,
    required: true,
  })
  @IsEmail({}, { message: 'Некорректный формат email' })
  @IsNotEmpty({ message: 'Email не может быть пустым' })
  @MaxLength(100)
  email: string;

  @ApiProperty({
    description: 'Цена за час занятий (в рублях)',
    example: 1500,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Цена должна быть числом' })
  @Min(0, { message: 'Цена не может быть отрицательной' })
  price: number;
}