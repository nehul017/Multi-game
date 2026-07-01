import { messageRepository } from '../repositories/message.repository';
import { AppError } from '../utils/AppError';
import { IMessageDocument } from '../interfaces/message.interface';

class ChatService {
  async sendMessage(
    senderId: string,
    data: { receiver?: string; room?: string; content: string; type?: 'text' | 'emoji' | 'system' }
  ): Promise<IMessageDocument> {
    if (!data.receiver && !data.room) {
      throw new AppError('Either receiver or room is required', 400);
    }

    const message = await messageRepository.create({
      sender: senderId,
      receiver: data.receiver || null,
      room: data.room || null,
      content: data.content,
      type: data.type || 'text',
    } as any);

    return message;
  }

  async getMessages(userId: string, otherUserId: string, page: number = 1, limit: number = 50) {
    return messageRepository.getConversation(userId, otherUserId, page, limit);
  }

  async getRoomMessages(room: string, page: number = 1, limit: number = 50) {
    return messageRepository.getRoomMessages(room, page, limit);
  }

  async getConversations(userId: string) {
    return messageRepository.getConversationList(userId);
  }

  async markAsRead(userId: string, senderId: string): Promise<void> {
    await messageRepository.markConversationAsRead(senderId, userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return messageRepository.getUnreadCount(userId);
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await messageRepository.findById(messageId);
    if (!message) throw new AppError('Message not found', 404);
    if (message.sender.toString() !== userId) {
      throw new AppError('Not authorized to delete this message', 403);
    }
    await messageRepository.deleteById(messageId);
  }
}

export const chatService = new ChatService();
