import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { register } from 'prom-client';

@Controller('metrics')
export class PrometheusController {
  @SkipThrottle()
  @Get()
  async metrics(@Res() res: Response): Promise<void> {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
}
