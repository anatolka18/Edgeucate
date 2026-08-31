import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../../common/validators/password.validator';

export enum Role {
  STUDENT = 'Student',
  TEACHER = 'Teacher',
}

export class SignUpDto {
  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван Иванов',
    maxLength: 50,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50, { message: 'Имя пользователя не должно превышать 50 символов' })
  readonly username: string;

  @ApiProperty({
    description: 'Пароль. Минимум 8 символов, должен содержать заглавные буквы, строчные буквы, цифры и специальные символы',
    example: 'StrongPassword123!',
    minLength: 8,
    required: true,
  })
  @IsStrongPassword()
  readonly password: string;

  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
    format: 'email',
    maxLength: 100,
    required: true,
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Введите корректный email' })
  @MaxLength(100)
  readonly email: string;

  @ApiProperty({
    description: 'Роль пользователя',
    example: Role.STUDENT,
    enum: Role,
    enumName: 'Role',
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(Role, { message: 'Роль должна быть Student или Teacher' })
  readonly role: Role;
}