import { BaseRepository } from './base.repository';
import { Message } from '../models/message.model';
import { IMessageDocument } from '../interfaces/message.interface';

class MessageRepository extends BaseRepository<IMessageDocument> {
  constructor() {
    super(Message);
  }

  async getConversation(user1: string, user2: string, page: number, limit: number): Promise<{ data: IMessageDocument[]; total: number; page: number; pages: number }> {
    const filter = {
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    };
    return this.findMany(filter, { page, limit, sort: '-createdAt', populate: 'sender receiver' });
  }

  async getRoomMessages(room: string, page: number, limit: number): Promise<{ data: IMessageDocument[]; total: number; page: number; pages: number }> {
    return this.findMany({ room }, { page, limit, sort: '-createdAt', populate: 'sender' });
  }

  async markAsRead(messageIds: string[]): Promise<void> {
    await this.model.updateMany(
      { _id: { $in: messageIds } },
      { isRead: true, readAt: new Date() }
    );
  }

  async markConversationAsRead(senderId: string, receiverId: string): Promise<void> {
    await this.model.updateMany(
      { sender: senderId, receiver: receiverId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.model.countDocuments({ receiver: userId, isRead: false });
  }

  async getConversationList(userId: string): Promise<IMessageDocument[]> {
    return this.model.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId },
          ],
          room: null,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$sender', userId] },
              then: '$receiver',
              else: '$sender',
            },
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$isRead', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]) as unknown as IMessageDocument[];
  }
}

export const messageRepository = new MessageRepository();
