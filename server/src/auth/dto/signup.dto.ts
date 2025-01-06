import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

export enum Role {
  STUDENT = 'Student',
  TEACHER = 'Teacher',
}

export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  readonly username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be more than 6 symbols.' })
  readonly password: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter correct email' })
  readonly email: string;

  @IsNotEmpty()
  @IsEnum(Role, { message: 'Please enter correct role' })
  readonly role: Role;
}