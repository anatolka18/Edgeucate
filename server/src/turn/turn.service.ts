import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class TurnService {
  constructor(private configService: ConfigService) {}

  getCredentials() {
    const url = this.configService.get<string>('TURN_URL');
    const secret = this.configService.get<string>('TURN_SECRET');
    const staticUsername = this.configService.get<string>('TURN_USERNAME');
    const staticCredential = this.configService.get<string>('TURN_PASSWORD');

    if (!url) {
      throw new BadRequestException('TURN server is not configured');
    }

    if (secret) {
      const ttl = 7200; 
      const timestamp = Math.floor(Date.now() / 1000) + ttl;
      const username = `${timestamp}:edgeucate`;
      
      const hmac = crypto.createHmac('sha1', secret);
      hmac.update(username);
      const credential = hmac.digest('base64');

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

    if (!staticUsername || !staticCredential) {
      throw new BadRequestException('TURN credentials are not configured');
    }

    return {
      urls: [
        `turn:${url}:3478`,
        `turn:${url}:3478?transport=tcp`,
        `turns:${url}:5349?transport=tcp`,
      ],
      username: staticUsername,
      credential: staticCredential,
    };
  }
}