import { notificationRepository } from '../repositories/notification.repository';
import { AppError } from '../utils/AppError';
import { INotificationDocument, NotificationType } from '../interfaces/notification.interface';

class NotificationService {
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, unknown> = {}
  ): Promise<INotificationDocument> {
    return notificationRepository.create({
      user: userId,
      type,
      title,
      message,
      data,
    } as any);
  }

  async getByUser(userId: string, page: number = 1, limit: number = 20) {
    return notificationRepository.findByUser(userId, page, limit);
  }

  async markAsRead(notificationId: string, userId: string): Promise<INotificationDocument> {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) throw new AppError('Notification not found', 404);
    if (notification.user.toString() !== userId) {
      throw new AppError('Not authorized', 403);
    }

    const updated = await notificationRepository.markAsRead(notificationId);
    if (!updated) throw new AppError('Failed to update notification', 500);
    return updated;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await notificationRepository.markAllAsRead(userId);
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) throw new AppError('Notification not found', 404);
    if (notification.user.toString() !== userId) {
      throw new AppError('Not authorized', 403);
    }
    await notificationRepository.deleteById(notificationId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.getUnreadCount(userId);
  }
}

export const notificationService = new NotificationService();
