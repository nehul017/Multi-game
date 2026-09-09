import { Request, Response, NextFunction } from 'express';
import { matchService } from '../services/match.service';
import { gameResultService } from '../services/game-result.service';

class MatchController {
  async createMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { gameType, settings } = req.body;
      const match = await matchService.createMatch(gameType, req.user!._id.toString(), settings);
      res.status(201).json({ success: true, data: match });
    } catch (error) {
      next(error);
    }
  }

  async getMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const match = await matchService.getMatch(req.params.id);
      res.json({ success: true, data: match });
    } catch (error) {
      next(error);
    }
  }

  async getMatchesByUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || req.user!._id.toString();
      const { page = '1', limit = '20' } = req.query;
      const result = await matchService.getMatchesByUser(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getMatchesByGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20' } = req.query;
      const result = await matchService.getMatchesByGame(
        req.params.gameType,
        parseInt(page as string),
        parseInt(limit as string)
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getReplay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const replay = await matchService.getReplay(req.params.id);
      res.json({ success: true, data: replay });
    } catch (error) {
      next(error);
    }
  }

  async getWaitingMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const matches = await matchService.getWaitingMatches(req.params.gameType);
      res.json({ success: true, data: matches });
    } catch (error) {
      next(error);
    }
  }

  async joinMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const match = await matchService.joinMatch(req.params.id, req.user!._id.toString());
      res.json({ success: true, data: match });
    } catch (error) {
      next(error);
    }
  }

  async leaveMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const match = await matchService.leaveMatch(req.params.id, req.user!._id.toString());
      res.json({ success: true, data: match });
    } catch (error) {
      next(error);
    }
  }

  async getMatchResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await matchService.getMatchResult(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async startSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { gameType, gameId, settings } = req.body as {
        gameType?: string;
        gameId?: string;
        settings?: Record<string, unknown>;
      };
      const result = await gameResultService.startSession(
        req.user!._id.toString(),
        gameType || gameId || '',
        settings || {}
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async completeMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await gameResultService.completeSession(
        req.params.id,
        req.user!._id.toString(),
        req.body || {}
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async recordScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await gameResultService.recordScore(
        req.params.id,
        req.user!._id.toString(),
        req.body || {}
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async abortMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await gameResultService.abortSession(req.params.id, req.user!._id.toString());
      res.json({ success: true, data: { status: 'aborted' } });
    } catch (error) {
      next(error);
    }
  }
}

export const matchController = new MatchController();
