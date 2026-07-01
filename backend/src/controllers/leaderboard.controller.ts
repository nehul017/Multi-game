import { Request, Response, NextFunction } from 'express';
import { leaderboardService } from '../services/leaderboard.service';
import { rankingService } from '../services/ranking.service';
import { LeaderboardPeriod } from '../interfaces/leaderboard.interface';

class LeaderboardController {
  async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { gameType } = req.params;
      const { period = 'all_time', page = '1', limit = '20' } = req.query;
      const result = await leaderboardService.getLeaderboard(
        gameType,
        period as LeaderboardPeriod,
        parseInt(page as string),
        parseInt(limit as string)
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getRank(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || req.user!._id.toString();
      const { gameType } = req.params;
      const { period = 'all_time' } = req.query;
      const rank = await leaderboardService.getRank(userId, gameType, period as LeaderboardPeriod);
      const rankInfo = req.user ? rankingService.getRankInfo(req.user.elo) : null;
      res.json({ success: true, data: { rank, rankInfo } });
    } catch (error) {
      next(error);
    }
  }
}

export const leaderboardController = new LeaderboardController();
