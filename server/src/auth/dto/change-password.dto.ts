import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../../common/validators/password.validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Текущий пароль пользователя',
    example: 'OldPassword123!',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'Новый пароль. Минимум 8 символов, должен содержать заглавные буквы, строчные буквы, цифры и специальные символы',
    example: 'NewStrongPassword456!',
    minLength: 8,
    required: true,
  })
  @IsStrongPassword()
  newPassword: string;
}