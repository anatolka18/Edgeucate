import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Message } from './schemas/message.schema';
import { SendMessageDto } from '../user/dto/sendMessage.dto';
import { User } from '../user/schemas/user.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: mongoose.Model<Message>,
    @InjectModel(User.name) private userModel: mongoose.Model<User>,
  ) {}

  async sendMessage(dto: SendMessageDto): Promise<Message> {
    const { sender, recipient, message } = dto;

    const senderUser = await this.userModel.findOne({ email: sender });
    const recipientUser = await this.userModel.findOne({ email: recipient });

    if (!senderUser || !recipientUser) {
      throw new NotFoundException('Пользователь не найден.');
    }

    const newMessage = await this.messageModel.create({
      sender,
      recipient,
      message,
      checked: false,
      date: new Date(),
    });

    await this.userModel.findOneAndUpdate(
      { email: sender },
      { $addToSet: { chat: { interlocutor: recipient, avatar: recipientUser.avatar } } },
    );

    await this.userModel.findOneAndUpdate(
      { email: recipient },
      { $addToSet: { chat: { interlocutor: sender, avatar: senderUser.avatar } } },
    );

    return newMessage;
  }

  async getMessages(
    sender: string,
    recipient: string,
    limit = 50,
    before?: string,
    ): Promise<{ messages: Message[]; interlocutorName: string; hasMore: boolean }> {
    const recipientUser = await this.userModel.findOne({ email: recipient });
    if (!recipientUser) {
        throw new NotFoundException('Пользователь не найден.');
    }

    const filter: any = {
        $or: [
        { sender, recipient },
        { sender: recipient, recipient: sender },
        ],
    };

    if (before) {
        filter.date = { $lt: new Date(before) };
    }

    const messages = await this.messageModel
        .find(filter)
        .sort({ date: -1 })
        .limit(limit + 1)
        .exec();

    const reversed = messages.reverse();

    const hasMore = reversed.length > limit;
    if (hasMore) {
        reversed.shift();
    }

    return {
        messages: reversed,
        interlocutorName: recipientUser.username,
        hasMore,
    };
    }

  async getChats(email: string): Promise<any[]> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Пользователь не найден.');
    if (user.chat.length === 0) return [];

    const interlocutorEmails = user.chat.map(c => c.interlocutor);

    const interlocutors = await this.userModel.find(
      { email: { $in: interlocutorEmails } },
      { email: 1, username: 1, online: 1, avatar: 1 },
    );
    const interlocutorMap = new Map(interlocutors.map(i => [i.email, i]));

    const chatStats = await this.messageModel.aggregate([
      {
        $match: {
          $or: [
            { sender: email },
            { recipient: email },
          ],
        },
      },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$sender', email] },
              then: '$recipient',
              else: '$sender',
            },
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$sender', '$_id'] },
                    { $eq: ['$checked', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const statsMap = new Map(chatStats.map(stat => [stat._id, stat]));

    return user.chat.map(chat => {
      const stats = statsMap.get(chat.interlocutor) || {};
      const interlocutor = interlocutorMap.get(chat.interlocutor);
      return {
        interlocutor: chat.interlocutor,
        avatar: chat.avatar,
        online: interlocutor?.online || false,
        username: interlocutor?.username || 'Unknown User',
        unreadCount: stats.unreadCount || 0,
        lastMessage: stats.lastMessage
          ? {
              message: stats.lastMessage.message,
              date: stats.lastMessage.date,
              sender: stats.lastMessage.sender,
            }
          : null,
      };
    });
  }

  async markMessagesAsRead(readerEmail: string, fromEmail: string): Promise<void> {
    await this.messageModel.updateMany(
      { sender: fromEmail, recipient: readerEmail, checked: false },
      { $set: { checked: true } },
    );
  }

  async getUnreadCount(recipientEmail: string, senderEmail: string): Promise<number> {
    return this.messageModel.countDocuments({
      sender: senderEmail,
      recipient: recipientEmail,
      checked: false,
    });
  }

  async migrateExistingMessages(): Promise<void> {
    const users = await this.userModel.collection.find({}).toArray();

    for (const user of users) {
      if (!user.chat) continue;
      for (const chat of user.chat) {
        if (!chat.messages || !Array.isArray(chat.messages)) continue;
        for (const msg of chat.messages) {
          const exists = await this.messageModel.findOne({
            sender: msg.sender,
            recipient: chat.interlocutor,
            message: msg.message,
            date: msg.date,
          });

          if (!exists) {
            await this.messageModel.create({
              sender: msg.sender,
              recipient: chat.interlocutor,
              message: msg.message,
              checked: msg.checked || false,
              date: msg.date,
            });
          }
        }
      }
    }
  }
}