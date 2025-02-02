import { Injectable, NotFoundException } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Message, User } from './schemas/user.schema';
import { UpdateUserDto } from './dto/updateUser.dto';
import { SendMessageDto } from './dto/sendMessage.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(updateUserDto: UpdateUserDto): Promise<User> {
    return this.userModel.findOneAndUpdate(
      { email: updateUserDto.email },
      { description: updateUserDto.description },
      { new: true },
    );
  }

  async getMessages(
    senderEmail: string,
    recipientEmail: string,
  ): Promise<{ messages: any[]; interlocutorName: string }> {
    const sender = await this.userModel.findOne({ email: senderEmail });
    const recipient = await this.userModel.findOne({ email: recipientEmail });

    if (!sender || !recipient) {
      throw new NotFoundException('Пользователь не найден.');
    }

    const chat = sender.chat.find((c) => c.interlocutor === recipientEmail);

    if (!chat) {
      return { messages: [], interlocutorName: recipient.username };
    }

    return { messages: chat.messages, interlocutorName: recipient.username };
  }

  async getChats(email: string): Promise<any[]> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Пользователь не найден.');

    if (user.chat.length === 0) return [];

    const interlocutorEmails = user.chat.map((c) => c.interlocutor);

    const interlocutors = await this.userModel.find(
      { email: { $in: interlocutorEmails } },
      { email: 1, username: 1, online: 1, avatar: 1 },
    );

    const interlocutorMap = new Map(interlocutors.map((i) => [i.email, i]));

    return user.chat.map((chat) => {
      const interlocutor = interlocutorMap.get(chat.interlocutor);
      // Считаем непрочитанные сообщения от собеседника
      const unreadCount = chat.messages.filter(m => m.sender === chat.interlocutor && !m.checked).length;
      return {
        ...chat,
        online: interlocutor?.online || false,
        username: interlocutor?.username || 'Unknown User',
        unreadCount,
      };
    });
  }

  async sendMessage(sendMessageDto: SendMessageDto): Promise<Message> {
    const { sender: senderEmail, recipient: recipientEmail, message: text } = sendMessageDto;

    const message: Message = {
      message: text,
      checked: false,
      date: new Date(),
      sender: senderEmail,
    };

    const senderUpdate = await this.userModel.findOneAndUpdate(
      { email: senderEmail, 'chat.interlocutor': recipientEmail },
      { $push: { 'chat.$.messages': message } },
      { new: true },
    );

    if (!senderUpdate) {
      await this.userModel.findOneAndUpdate(
        { email: senderEmail },
        {
          $push: {
            chat: {
              interlocutor: recipientEmail,
              messages: [message],
              avatar: '',
            },
          },
        },
      );
    }

    const recipientUpdate = await this.userModel.findOneAndUpdate(
      { email: recipientEmail, 'chat.interlocutor': senderEmail },
      { $push: { 'chat.$.messages': message } },
      { new: true },
    );

    if (!recipientUpdate) {
      await this.userModel.findOneAndUpdate(
        { email: recipientEmail },
        {
          $push: {
            chat: {
              interlocutor: senderEmail,
              messages: [message],
              avatar: '',
            },
          },
        },
      );
    }

    return message;
  }

  async markMessagesAsRead(readerEmail: string, fromEmail: string) {
    await this.userModel.updateOne(
      { email: readerEmail, 'chat.interlocutor': fromEmail },
      { $set: { 'chat.$.messages.$[msg].checked': true } },
      { arrayFilters: [{ 'msg.sender': fromEmail, 'msg.checked': false }] },
    );
  }

  async online(email: string) {
    await this.userModel.findOneAndUpdate({ email }, { online: true, dateLastOnline: new Date() });
  }

  async offline(email: string) {
    await this.userModel.findOneAndUpdate({ email }, { online: false, dateLastOnline: new Date() });
  }

  async getUsersByEmails(emails: string[]): Promise<{ email: string; online: boolean }[]> {
    const users = await this.userModel.find(
        { email: { $in: emails } },
        { email: 1, online: 1 }
    ).lean();
    return users;
  }
}