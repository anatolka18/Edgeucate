import { IsEmail, IsString, IsNumber, IsDateString, Matches } from 'class-validator';

export class CreateCalendarEventDto {
  @IsEmail()
  teacher_email: string;

  @IsEmail()
  student_email: string;

  @IsString()
  teacher_username: string;

  @IsString()
  student_username: string;

  @IsString()
  title: string;

  @IsDateString()
  date: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Time must be in HH:mm format' })
  time: string;

  @IsNumber()
  cost: number;
}