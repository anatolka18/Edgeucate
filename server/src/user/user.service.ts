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

    chat.messages.forEach((message) => {
      if (!message.checked) message.checked = true;
    });

    await this.userModel.updateOne(
      { email: senderEmail, 'chat.interlocutor': recipientEmail },
      { $set: { 'chat.$.messages': chat.messages } },
    );

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
      return {
        ...chat,
        online: interlocutor?.online || false,
        username: interlocutor?.username || 'Unknown User',
      };
    });
  }

  async sendMessage(sendMessageDto: SendMessageDto): Promise<Message> {
    const sender = await this.userModel.findOne({ email: sendMessageDto.sender });
    const recipient = await this.userModel.findOne({ email: sendMessageDto.recipient });

    if (!sender || !recipient) throw new NotFoundException('Пользователь не найден.');

    const message: Message = {
      message: sendMessageDto.message,
      checked: false,
      date: new Date(),
      sender: sendMessageDto.sender,
    };

    const senderChat = sender.chat.find((c) => c.interlocutor === sendMessageDto.recipient);
    const recipientChat = recipient.chat.find((c) => c.interlocutor === sendMessageDto.sender);

    if (senderChat) {
      senderChat.messages.push(message);
    } else {
      sender.chat.push({
        interlocutor: sendMessageDto.recipient,
        messages: [message],
        avatar: recipient.avatar,
      });
    }

    if (recipientChat) {
      recipientChat.messages.push(message);
    } else {
      recipient.chat.push({
        interlocutor: sendMessageDto.sender,
        messages: [message],
        avatar: sender.avatar,
      });
    }

    await sender.save();
    await recipient.save();

    return message;
  }

  async online(email: string) {
    await this.userModel.findOneAndUpdate({ email }, { online: true, dateLastOnline: new Date() });
  }

  async offline(email: string) {
    await this.userModel.findOneAndUpdate({ email }, { online: false, dateLastOnline: new Date() });
  }

  async markMessagesAsRead(readerEmail: string, fromEmail: string) {
  await this.userModel.updateOne(
    { email: readerEmail, 'chat.interlocutor': fromEmail },
    { $set: { 'chat.$.messages.$[msg].checked': true } },
    { arrayFilters: [{ 'msg.sender': fromEmail, 'msg.checked': false }] },
  );
}
}