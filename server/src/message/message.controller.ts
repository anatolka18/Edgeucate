import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { MessageService } from './message.service';
import { SendMessageDto } from '../user/dto/sendMessage.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.messageService.sendMessage(dto);
  }

  @Post('get')
  @UseGuards(JwtAuthGuard)
  async getMessages(@Request() req, @Body() body: { recipient: string; limit?: number; before?: string }) {
    const sender = req.user.email;
    const { recipient, limit = 50, before } = body;
    return this.messageService.getMessages(sender, recipient, limit, before);
  }

  @Post('chats')
  @UseGuards(JwtAuthGuard)
  async getChats(@Request() req) {
    const email = req.user.email;
    return this.messageService.getChats(email);
  }

  @Post('mark-read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Body() body: { readerEmail: string; fromEmail: string }) {
    await this.messageService.markMessagesAsRead(body.readerEmail, body.fromEmail);
    return { success: true };
  }

  @Post('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@Body() body: { recipientEmail: string; senderEmail: string }) {
    const count = await this.messageService.getUnreadCount(body.recipientEmail, body.senderEmail);
    return { count };
  }
}