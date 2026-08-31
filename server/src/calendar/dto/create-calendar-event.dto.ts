import { IsEmail, IsString, IsNumber, IsDateString, Matches, IsNotEmpty, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCalendarEventDto {
  @ApiProperty({
    description: 'Email учителя',
    example: 'teacher@example.com',
    format: 'email',
    maxLength: 100,
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  teacher_email: string;

  @ApiProperty({
    description: 'Email студента',
    example: 'student@example.com',
    format: 'email',
    maxLength: 100,
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  student_email: string;

  @ApiProperty({
    description: 'Имя пользователя учителя',
    example: 'Иван Иванов',
    maxLength: 50,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  teacher_username: string;

  @ApiProperty({
    description: 'Имя пользователя студента',
    example: 'Мария Петрова',
    maxLength: 50,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  student_username: string;

  @ApiProperty({
    description: 'Название события занятия',
    example: 'Урок математики: подготовка к ЕГЭ',
    maxLength: 100,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Название события не должно превышать 100 символов' })
  title: string;

  @ApiProperty({
    description: 'Дата события в формате ISO 8601',
    example: '2026-09-15',
    format: 'date',
    required: true,
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Время начала занятия в формате HH:mm (24 часа)',
    example: '14:30',
    pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
    required: true,
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Время должно быть в формате HH:mm' })
  time: string;

  @ApiProperty({
    description: 'Стоимость занятия (в рублях)',
    example: 1500,
    minimum: 0,
    required: true,
  })
  @IsNumber()
  @Min(0, { message: 'Стоимость не может быть отрицательной' })
  cost: number;
}