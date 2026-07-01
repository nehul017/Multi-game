import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';

class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20' } = req.query;
      const result = await notificationService.getByUser(
        req.user!._id.toString(),
        parseInt(page as string),
        parseInt(limit as string)
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user!._id.toString());
      res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markAllAsRead(req.user!._id.toString());
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.delete(req.params.id, req.user!._id.toString());
      res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await notificationService.getUnreadCount(req.user!._id.toString());
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
