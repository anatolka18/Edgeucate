import { IsString, IsNotEmpty, MaxLength, IsNumber, Min } from 'class-validator';

export class UpdateAdvertisementDto {
  @IsString()
  @IsNotEmpty({ message: 'ID объявления не может быть пустым' })
  @MaxLength(100)
  advertisementId: string;

  @IsString()
  @IsNotEmpty({ message: 'Заголовок не может быть пустым' })
  @MaxLength(100, { message: 'Заголовок не должен превышать 100 символов' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Описание не может быть пустым' })
  @MaxLength(1000, { message: 'Описание не должно превышать 1000 символов' })
  aboutAdvertisement: string;

  @IsNumber({}, { message: 'Цена должна быть числом' })
  @Min(0, { message: 'Цена не может быть отрицательной' })
  price: number;
}