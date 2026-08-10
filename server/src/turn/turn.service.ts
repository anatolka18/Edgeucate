import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TurnService {
  constructor(private configService: ConfigService) {}

  getCredentials() {
    const url = this.configService.get<string>('TURN_URL');
    const username = this.configService.get<string>('TURN_USERNAME');
    const credential = this.configService.get<string>('TURN_PASSWORD');

    if (!url || !username || !credential) {
      throw new BadRequestException('TURN server is not configured');
    }

    return {
      urls: [
        `turn:${url}:3478`,
        `turn:${url}:3478?transport=tcp`,
        `turns:${url}:5349?transport=tcp`,
      ],
      username,
      credential,
    };
  }
}