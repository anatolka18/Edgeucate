import { IsString, IsNumber, IsNotEmpty, Min, MaxLength, IsEmail, IsOptional } from 'class-validator';

export class CreateAdvertisementDto {
  @IsString()
  @IsNotEmpty({ message: 'Заголовок не может быть пустым' })
  @MaxLength(100, { message: 'Заголовок не должен превышать 100 символов' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Предмет не может быть пустым' })
  @MaxLength(50, { message: 'Предмет не должен превышать 50 символов' })
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'Описание не может быть пустым' })
  @MaxLength(1000, { message: 'Описание не должно превышать 1000 символов' })
  aboutAdvertisement: string;

  @IsEmail({}, { message: 'Некорректный формат email' })
  @IsNotEmpty({ message: 'Email не может быть пустым' })
  @MaxLength(100)
  email: string;

  @IsNumber({}, { message: 'Цена должна быть числом' })
  @Min(0, { message: 'Цена не может быть отрицательной' })
  price: number;
}