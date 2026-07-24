import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '../../common/validators/password.validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @IsStrongPassword()
  newPassword: string;
}