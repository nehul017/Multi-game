import { Request, Response, NextFunction } from 'express';
import { achievementService } from '../services/achievement.service';

class AchievementController {
  async getAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      const achievements = await achievementService.getAchievements(userId);
      res.json({ success: true, data: achievements });
    } catch (error) {
      next(error);
    }
  }

  async getUserAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || req.user!._id.toString();
      const achievements = await achievementService.getUserAchievements(userId);
      res.json({ success: true, data: achievements });
    } catch (error) {
      next(error);
    }
  }
}

export const achievementController = new AchievementController();
