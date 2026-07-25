import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { economyService } from '../services/economy.service';
import { storeService } from '../services/store.service';
import { missionService } from '../services/mission.service';

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

  async adjustCoins(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, reason } = req.body;
      const data = await economyService.adminAdjustCoins(
        req.params.id,
        Number(amount),
        reason || 'Admin adjustment'
      );
      res.json({ success: true, data, message: 'Coins updated' });
    } catch (error) {
      next(error);
    }
  }

  async getStoreItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const data = await storeService.getAllItemsAdmin(page);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createStoreItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await storeService.createItem(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateStoreItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await storeService.updateItem(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteStoreItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await storeService.deleteItem(req.params.id);
      res.json({ success: true, message: 'Store item deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getCoinPacks(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await storeService.getAllPacksAdmin();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createCoinPack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await storeService.createPack(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateCoinPack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await storeService.updatePack(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteCoinPack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await storeService.deletePack(req.params.id);
      res.json({ success: true, message: 'Coin pack deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getMissions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await missionService.getAllMissionsAdmin();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createMission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await missionService.createMission(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateMission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await missionService.updateMission(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteMission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await missionService.deleteMission(req.params.id);
      res.json({ success: true, message: 'Mission deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
