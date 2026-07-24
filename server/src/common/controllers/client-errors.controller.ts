import { Controller, Post, Body } from '@nestjs/common';
import { logger } from '../logger/winston.logger';

@Controller('errors')
export class ClientErrorsController {
  @Post('log')
  logClientError(@Body() body: any) {
    logger.error('Client error', body);
    return { success: true };
  }
}