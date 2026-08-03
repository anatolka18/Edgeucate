import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AdvertisementService } from './advertisement.service';
import { Advertisement } from './schemas/advertisement.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CsrfGuard } from '../guards/csrf.guard';
import { Roles } from '../guards/roles.decorator';
import { Role } from '../user/schemas/user.schema';
import { CreateAdvertisementDto } from './dto/createAdvertisement.dto';
import { UpdateAdvertisementDto } from './dto/updateAdvertisement.dto';

@Controller('advertisement')
export class AdvertisementController {
  constructor(private advertisementService: AdvertisementService) { }

  @Post('/my')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  getMyAdvertisement(@Request() req) {
    return this.advertisementService.findMyAdvertisements(req.user.email);
  }

  @Get('search')
  searchAdvertisements(
    @Query('query') query: string,
    @Query('subject') subject: string,
  ) {
    return this.advertisementService.search(query || '', subject || '');
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.advertisementService.findAll(
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  @Put('/update')
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(Role.TEACHER)
  updateAdvertisement(@Body() updateAdvertisementDto: UpdateAdvertisementDto): Promise<Advertisement> {
    return this.advertisementService.updateAdvertisement(updateAdvertisementDto);
  }

  @Get(':advertisementId')
  getAdvertisement(@Param('advertisementId') advertisementId: string) {
    return this.advertisementService.findByAdvertisementId(advertisementId);
  }

  @Post('/create')
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(Role.TEACHER)
  async createAdvertisement(@Body() createAdvertisementDto: CreateAdvertisementDto) {
    return this.advertisementService.createAdvertisement(createAdvertisementDto);
  }

  @Delete(':advertisementId')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async deleteAdvertisement(@Param('advertisementId') advertisementId: string) {
    return this.advertisementService.deleteAdvertisement(advertisementId);
  }
}