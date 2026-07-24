import { IsString, IsNotEmpty, MaxLength, IsEmail, IsNumber, Min, Max } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  advertisementId: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  studentEmail: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  teacherEmail: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Текст отзыва не должен превышать 500 символов' })
  text: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsNumber()
  @Min(1, { message: 'Оценка должна быть от 1 до 5' })
  @Max(5, { message: 'Оценка должна быть от 1 до 5' })
  stars: number;
}