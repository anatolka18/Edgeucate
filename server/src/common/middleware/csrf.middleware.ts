import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { APP_CONFIG } from '../config/app.config';
import * as crypto from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (!req.cookies?.['csrf-token']) {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie('csrf-token', token, {
        httpOnly: false,
        secure: process.env.SECURE_COOKIE === 'true',
        sameSite: 'lax',
        maxAge: APP_CONFIG.TOKEN.CSRF_COOKIE_MAX_AGE_MS,
      });
    }
    next();
  }
}