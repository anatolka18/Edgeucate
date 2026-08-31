import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../../common/validators/password.validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Токен сброса пароля (полученный из письма)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Новый пароль. Минимум 8 символов, должен содержать заглавные буквы, строчные буквы, цифры и специальные символы',
    example: 'NewSecurePassword789!',
    minLength: 8,
    required: true,
  })
  @IsStrongPassword()
  password: string;
}