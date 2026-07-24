import { IsEmail, IsString, IsNumber, IsDateString, Matches, IsNotEmpty, MaxLength, Min } from 'class-validator';

export class CreateCalendarEventDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  teacher_email: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  student_email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  teacher_username: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  student_username: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Название события не должно превышать 100 символов' })
  title: string;

  @IsDateString()
  date: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Время должно быть в формате HH:mm' })
  time: string;

  @IsNumber()
  @Min(0, { message: 'Стоимость не может быть отрицательной' })
  cost: number;
}