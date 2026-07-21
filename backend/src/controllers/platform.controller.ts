import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';

class PlatformController {
  async getStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await settingsService.getPlatformStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }
}

export const platformController = new PlatformController();
