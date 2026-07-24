import { IsString, IsNumber, IsNotEmpty, Min, MaxLength, IsEmail } from 'class-validator';

export class CreateAdvertisementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Заголовок не должен превышать 100 символов' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50, { message: 'Предмет не должен превышать 50 символов' })
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Описание не должно превышать 1000 символов' })
  aboutAdvertisement: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @IsNumber()
  @Min(0, { message: 'Цена не может быть отрицательной' })
  price: number;
}