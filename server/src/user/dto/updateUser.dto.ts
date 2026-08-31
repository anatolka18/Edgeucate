import { IsString, IsNotEmpty, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Описание профиля пользователя (о себе). Для учителей — информация о опыте преподавания, для студентов — о целях обучения.',
    example: 'Опытный преподаватель математики с 10-летним стажем. Специализируюсь на подготовке к ЕГЭ и олимпиадам.',
    maxLength: 500,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Описание не должно превышать 500 символов' })
  description: string;

  @ApiProperty({
    description: 'Email пользователя (используется для идентификации при обновлении)',
    example: 'user@example.com',
    format: 'email',
    maxLength: 100,
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;
}