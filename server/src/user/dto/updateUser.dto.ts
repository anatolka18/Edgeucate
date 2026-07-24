import { IsString, IsNotEmpty, MaxLength, IsEmail } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Описание не должно превышать 500 символов' })
  description: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;
}