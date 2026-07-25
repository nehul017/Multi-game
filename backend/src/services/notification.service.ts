import { notificationRepository } from '../repositories/notification.repository';
import { AppError } from '../utils/AppError';
import { INotificationDocument, NotificationType } from '../interfaces/notification.interface';
import { getIO } from '../socket';
import { emitToUser } from '../socket/namespaces/notification';
import { SOCKET_EVENTS } from '../utils/constants';

class NotificationService {
  private async emitUnreadCount(userId: string): Promise<void> {
    try {
      const io = getIO();
      const count = await notificationRepository.getUnreadCount(userId);
      emitToUser(io, userId, SOCKET_EVENTS.NOTIFICATION.UNREAD_COUNT, { count });
    } catch {
      // Socket may not be initialized during tests or startup
    }
  }

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, unknown> = {}
  ): Promise<INotificationDocument> {
    const notification = await notificationRepository.create({
      user: userId,
      type,
      title,
      message,
      data,
    } as any);

    try {
      const io = getIO();
      emitToUser(io, userId, SOCKET_EVENTS.NOTIFICATION.NEW, {
        id: notification._id.toString(),
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });
    } catch {
      // Socket may not be initialized during tests or startup
    }

    await this.emitUnreadCount(userId);

    return notification;
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
    await this.emitUnreadCount(userId);
    return updated;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await notificationRepository.markAllAsRead(userId);
    await this.emitUnreadCount(userId);
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) throw new AppError('Notification not found', 404);
    if (notification.user.toString() !== userId) {
      throw new AppError('Not authorized', 403);
    }
    await notificationRepository.deleteById(notificationId);
    await this.emitUnreadCount(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.getUnreadCount(userId);
  }
}

export const notificationService = new NotificationService();
