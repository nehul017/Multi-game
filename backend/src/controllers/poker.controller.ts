import { Request, Response, NextFunction } from 'express';
import { pokerService } from '../services/poker.service';
import type { PokerGameType } from '../games/poker/core/game-state';

class PokerController {
  async getGame(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          ...pokerService.getCatalogInfo(),
          config: pokerService.getPublicConfig(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, data: pokerService.getPublicConfig() });
    } catch (error) {
      next(error);
    }
  }

  async listTables(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const gameType = req.query.gameType as PokerGameType | undefined;
      const tables = await pokerService.listTables(gameType);
      res.json({ success: true, data: tables });
    } catch (error) {
      next(error);
    }
  }

  async getTable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const table = await pokerService.getTable(req.params.tableId, userId);
      res.json({ success: true, data: table });
    } catch (error) {
      next(error);
    }
  }

  async createTable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const table = await pokerService.createTable(req.user!._id.toString(), req.body);
      res.status(201).json({ success: true, data: table });
    } catch (error) {
      next(error);
    }
  }

  async sit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const table = await pokerService.sit(
        req.user!._id.toString(),
        req.user!.username,
        req.user!.avatar || '',
        req.body.tableId,
        Number(req.body.buyIn),
        req.body.seatIndex
      );
      res.json({ success: true, data: table });
    } catch (error) {
      next(error);
    }
  }

  async history(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const tableId = typeof req.query.tableId === 'string' ? req.query.tableId : undefined;
      const history = await pokerService.history(req.user!._id.toString(), tableId, limit);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }
}

export const pokerController = new PokerController();
