import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';

class AdminController {
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20', search } = req.query;
      const result = await adminService.getUsers(
        parseInt(page as string),
        parseInt(limit as string),
        search as string
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async banUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      await adminService.banUser(req.params.id, req.user!._id.toString(), reason);
      res.json({ success: true, message: 'User banned' });
    } catch (error) {
      next(error);
    }
  }

  async unbanUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.unbanUser(req.params.id);
      res.json({ success: true, message: 'User unbanned' });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.deleteUser(req.params.id);
      res.json({ success: true, message: 'User deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getActiveGames(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const games = await adminService.getActiveGames();
      res.json({ success: true, data: games });
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20', status } = req.query;
      const result = await adminService.getReports(
        parseInt(page as string),
        parseInt(limit as string),
        status as string
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async resolveReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resolution, action } = req.body;
      const report = await adminService.resolveReport(
        req.params.id,
        req.user!._id.toString(),
        resolution,
        action
      );
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async broadcastAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, message } = req.body;
      await adminService.broadcastAnnouncement(title, message, req.user!._id.toString());
      res.json({ success: true, message: 'Announcement broadcast' });
    } catch (error) {
      next(error);
    }
  }

  async getServerHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await adminService.getServerHealth();
      res.json({ success: true, data: health });
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await adminService.getSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await adminService.updateSettings(req.body);
      res.json({ success: true, data: settings, message: 'Settings updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
