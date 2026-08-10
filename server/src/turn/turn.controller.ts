import { Controller, Get, UseGuards } from '@nestjs/common';
import { TurnService } from './turn.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('turn')
export class TurnController {
  constructor(private readonly turnService: TurnService) {}

  @Get('config')
  @UseGuards(JwtAuthGuard)
  getConfig() {
    return this.turnService.getCredentials();
  }
}