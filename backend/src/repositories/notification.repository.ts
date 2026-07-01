import { BaseRepository } from './base.repository';
import { Notification } from '../models/notification.model';
import { INotificationDocument } from '../interfaces/notification.interface';

class NotificationRepository extends BaseRepository<INotificationDocument> {
  constructor() {
    super(Notification);
  }

  async findByUser(userId: string, page: number, limit: number): Promise<{ data: INotificationDocument[]; total: number; page: number; pages: number }> {
    return this.findMany({ user: userId }, { page, limit, sort: '-createdAt' });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.model.countDocuments({ user: userId, isRead: false });
  }

  async markAsRead(notificationId: string): Promise<INotificationDocument | null> {
    return this.model.findByIdAndUpdate(
      notificationId,
      { isRead: true, readAt: new Date() },
      { new: true }
    ).exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.model.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  async deleteOldNotifications(userId: string, daysOld: number = 30): Promise<number> {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const result = await this.model.deleteMany({
      user: userId,
      isRead: true,
      createdAt: { $lt: cutoff },
    });
    return result.deletedCount || 0;
  }
}

export const notificationRepository = new NotificationRepository();
