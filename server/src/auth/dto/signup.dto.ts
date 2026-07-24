import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { IsStrongPassword } from '../../common/validators/password.validator';

export enum Role {
  STUDENT = 'Student',
  TEACHER = 'Teacher',
}

export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50, { message: 'Имя пользователя не должно превышать 50 символов' })
  readonly username: string;

  @IsStrongPassword()
  readonly password: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Введите корректный email' })
  @MaxLength(100)
  readonly email: string;

  @IsNotEmpty()
  @IsEnum(Role, { message: 'Роль должна быть Student или Teacher' })
  readonly role: Role;
}