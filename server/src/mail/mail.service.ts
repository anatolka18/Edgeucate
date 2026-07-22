import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { verificationTemplate, resetPasswordTemplate } from './templates';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const host = this.configService.get('SMTP_HOST');
    const port = parseInt(this.configService.get('SMTP_PORT') || '587');
    const secure = this.configService.get('SMTP_SECURE') === 'true';
    const user = this.configService.get('SMTP_USER');
    const pass = this.configService.get('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const clientUrl = this.configService.get('CLIENT_URL');
    const url = `${clientUrl}/verify-email?token=${token}`;

    const html = verificationTemplate(url, token, clientUrl);

    await this.transporter.sendMail({
      from: `"Edgeucate" <${this.configService.get('SMTP_FROM')}>`,
      to: email,
      subject: 'Подтверждение email',
      html,
    });
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const clientUrl = this.configService.get('CLIENT_URL');
    const url = `${clientUrl}/reset-password?token=${token}`;

    const html = resetPasswordTemplate(url, token, clientUrl);

    await this.transporter.sendMail({
      from: `"Edgeucate" <${this.configService.get('SMTP_FROM')}>`,
      to: email,
      subject: 'Восстановление пароля',
      html,
    });
  }
}