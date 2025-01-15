import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AdvertisementService } from './advertisement.service';
import { Advertisement } from './schemas/advertisement.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateAdvertisementDto } from './dto/createAdvertisement.dto';
import { UpdateAdvertisementDto } from './dto/updateAdvertisement.dto';
import { IUploadedFile } from './dto/mfile-class';

@Controller('advertisement')
export class AdvertisementController {
  constructor(private advertisementService: AdvertisementService) { }

  @Post('/my')
  @UseGuards(JwtAuthGuard)
  getMyAdvertisement(@Body() dto: { email: string }) {
    return this.advertisementService.findMyAdvertisements(dto.email);
  }

  @Get('search/:query')
  searchAdvertisements(@Param('query') query: string) {
    return this.advertisementService.searchByQuery(query);
  }

  @Get()
  findAll() {
    return this.advertisementService.findAll();
  }

  @Put('/update')
  @UseGuards(JwtAuthGuard)
  updateAdvertisement(@Body() updateAdvertisementDto: UpdateAdvertisementDto): Promise<Advertisement> {
    return this.advertisementService.updateAdvertisement(updateAdvertisementDto);
  }

  @Get(':advertisementId')
  getAdvertisement(@Param('advertisementId') advertisementId: string) {
    return this.advertisementService.findByAdvertisementId(advertisementId);
  }

  @Post('/create')
  async createAdvertisement(@Body() createAdvertisementDto: CreateAdvertisementDto) {
    return this.advertisementService.createAdvertisement(createAdvertisementDto);
  }

  @Put('avatar/:name')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard)
  updateAvatar(@UploadedFile() file: IUploadedFile, @Param('name') name: string): Promise<Advertisement> {
    return this.advertisementService.updateAvatar(name, file);
  }

  @Delete(':advertisementId')
  async deleteAdvertisement(@Param('advertisementId') advertisementId: string) {
    return this.advertisementService.deleteAdvertisement(advertisementId);
  }
}