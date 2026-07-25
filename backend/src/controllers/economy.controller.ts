import { Request, Response, NextFunction } from 'express';
import { economyService } from '../services/economy.service';
import { missionService } from '../services/mission.service';
import { storeService } from '../services/store.service';

class EconomyController {
  async getWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await economyService.getWallet(req.user!._id.toString());
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '20', 10);
      const data = await economyService.getTransactions(req.user!._id.toString(), page, limit);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getDailyLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await economyService.getDailyLoginStatus(req.user!._id.toString());
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async claimDailyLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await economyService.claimDailyLogin(req.user!._id.toString());
      await missionService.trackProgress(req.user!._id.toString(), 'login', 1);
      res.json({ success: true, data, message: 'Daily reward claimed' });
    } catch (error) {
      next(error);
    }
  }

  async getCoinPacks(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await economyService.getCoinPacks();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async purchasePack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await economyService.purchaseCoinPack(
        req.user!._id.toString(),
        req.params.packId
      );
      res.json({ success: true, data, message: 'Coins added to your wallet' });
    } catch (error) {
      next(error);
    }
  }

  async getMissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await missionService.getUserMissions(req.user!._id.toString());
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async claimMission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await missionService.claimMission(
        req.user!._id.toString(),
        req.params.missionId
      );
      res.json({ success: true, data, message: 'Mission reward claimed' });
    } catch (error) {
      next(error);
    }
  }

  async getCatalog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as any;
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const data = await storeService.getCatalog(type, page, limit);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async purchaseItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await storeService.purchaseItem(req.user!._id.toString(), req.params.itemId);
      res.json({ success: true, data, message: 'Item purchased' });
    } catch (error) {
      next(error);
    }
  }

  async getInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await storeService.getInventory(req.user!._id.toString());
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async equipItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await storeService.equipItem(req.user!._id.toString(), req.params.itemId);
      res.json({ success: true, data, message: 'Item equipped' });
    } catch (error) {
      next(error);
    }
  }

  async unequipItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await storeService.unequipItem(req.user!._id.toString(), req.params.itemId);
      res.json({ success: true, data, message: 'Item unequipped' });
    } catch (error) {
      next(error);
    }
  }
}

export const economyController = new EconomyController();
