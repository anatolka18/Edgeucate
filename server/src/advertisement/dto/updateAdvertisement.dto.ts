import { IsString, IsNotEmpty, MaxLength, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAdvertisementDto {
  @ApiProperty({
    description: 'ID объявления (MongoDB ObjectId)',
    example: '64f1a2b3c4d5e6f7g8h9i0j1',
    maxLength: 100,
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'ID объявления не может быть пустым' })
  @MaxLength(100)
  advertisementId: string;

  @ApiProperty({
    description: 'Новый заголовок объявления',
    example: 'Репетитор по математике для ЕГЭ и ОГЭ',
    maxLength: 100,
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Заголовок не может быть пустым' })
  @MaxLength(100, { message: 'Заголовок не должен превышать 100 символов' })
  title: string;

  @ApiProperty({
    description: 'Новое описание объявления',
    example: 'Обновлённое описание с акцентом на подготовку к ОГЭ',
    maxLength: 1000,
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Описание не может быть пустым' })
  @MaxLength(1000, { message: 'Описание не должно превышать 1000 символов' })
  aboutAdvertisement: string;

  @ApiProperty({
    description: 'Новая цена за час занятий (в рублях)',
    example: 1800,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Цена должна быть числом' })
  @Min(0, { message: 'Цена не может быть отрицательной' })
  price: number;
}