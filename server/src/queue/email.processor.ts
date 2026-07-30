import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from '../mail/mail.service';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<{ email: string; token: string; type: 'verify' | 'reset' }>): Promise<void> {
    switch (job.data.type) {
      case 'verify':
        await this.mailService.sendVerificationEmail(job.data.email, job.data.token);
        break;
      case 'reset':
        await this.mailService.sendResetPasswordEmail(job.data.email, job.data.token);
        break;
    }
  }
}