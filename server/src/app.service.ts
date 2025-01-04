import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getNameProject(): string {
    return 'Edgeucate';
  }
}