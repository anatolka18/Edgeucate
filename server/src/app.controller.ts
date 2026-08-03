import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getNameProject(): string {
    return this.appService.getNameProject();
  }

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request) {
    const token = req.cookies?.['csrf-token'] || '';
    return { token };
  }
}