import { IsString, IsNotEmpty, MaxLength, IsEmail, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({
    description: 'ID объявления репетитора (к которому относится отзыв)',
    example: '64f1a2b3c4d5e6f7g8h9i0j1',
    maxLength: 100,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  advertisementId: string;

  @ApiProperty({
    description: 'Email студента (автора отзыва)',
    example: 'student@example.com',
    format: 'email',
    maxLength: 100,
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  studentEmail: string;

  @ApiProperty({
    description: 'Email учителя (кому адресован отзыв)',
    example: 'teacher@example.com',
    format: 'email',
    maxLength: 100,
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  teacherEmail: string;

  @ApiProperty({
    description: 'Текст отзыва',
    example: 'Отличный преподаватель! Объясняет понятно, всегда готов помочь. Занимаюсь уже 3 месяца, прогресс значительный.',
    maxLength: 500,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Текст отзыва не должен превышать 500 символов' })
  text: string;

  @ApiProperty({
    description: 'Заголовок отзыва',
    example: 'Лучший репетитор по математике!',
    maxLength: 100,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: 'Оценка от 1 до 5 звёзд',
    example: 5,
    minimum: 1,
    maximum: 5,
    required: true,
    enum: [1, 2, 3, 4, 5],
    enumName: 'StarRating',
  })
  @IsNumber()
  @Min(1, { message: 'Оценка должна быть от 1 до 5' })
  @Max(5, { message: 'Оценка должна быть от 1 до 5' })
  stars: number;
}