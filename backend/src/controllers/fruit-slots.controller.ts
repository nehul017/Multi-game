import { Request, Response, NextFunction } from 'express';
import { fruitSlotsService } from '../services/fruit-slots.service';
import { FRUIT_SLOTS_GAME_ID } from '../games/fruit-slots/types';

class FruitSlotsController {
  async getGame(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          ...fruitSlotsService.getCatalogInfo(),
          config: fruitSlotsService.getPublicConfig(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, data: fruitSlotsService.getPublicConfig() });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const history = await fruitSlotsService.getHistory(
        req.user!._id.toString(),
        FRUIT_SLOTS_GAME_ID,
        limit
      );
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }
}

export const fruitSlotsController = new FruitSlotsController();
