import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { MessageService } from './message.service';
import { SendMessageDto } from '../user/dto/sendMessage.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CsrfGuard } from '../guards/csrf.guard';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    dto.sender = req.user.email;
    return this.messageService.sendMessage(dto);
  }

  @Post('get')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async getMessages(@Request() req, @Body() body: { recipient: string; limit?: number; before?: string }) {
    const sender = req.user.email;
    const { recipient, limit = 50, before } = body;
    
    if (!recipient) {
      throw new BadRequestException('Recipient is required');
    }
    
    return this.messageService.getMessages(sender, recipient, limit, before);
  }

  @Post('chats')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async getChats(@Request() req) {
    const email = req.user.email;
    return this.messageService.getChats(email);
  }

  @Post('mark-read')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async markAsRead(@Request() req, @Body() body: { fromEmail: string }) {
    const readerEmail = req.user.email;
    await this.messageService.markMessagesAsRead(readerEmail, body.fromEmail);
    return { success: true };
  }

  @Post('unread-count')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async getUnreadCount(@Request() req, @Body() body: { senderEmail: string }) {
    const recipientEmail = req.user.email;
    const count = await this.messageService.getUnreadCount(recipientEmail, body.senderEmail);
    return { count };
  }
}