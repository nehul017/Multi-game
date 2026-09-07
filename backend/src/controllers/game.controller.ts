import { Request, Response, NextFunction } from 'express';
import { gameService } from '../services/game.service';

class GameController {
  async createGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const game = await gameService.createGame(req.body);
      res.status(201).json({ success: true, data: game });
    } catch (error) {
      next(error);
    }
  }

  async getGames(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '100' } = req.query;
      const result = await gameService.getGames(parseInt(page as string), parseInt(limit as string));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getGameBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const game = await gameService.getGameBySlug(req.params.slug);
      res.json({ success: true, data: game });
    } catch (error) {
      next(error);
    }
  }

  async getGameById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const game = await gameService.getGameById(req.params.id);
      res.json({ success: true, data: game });
    } catch (error) {
      next(error);
    }
  }

  async updateGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const game = await gameService.updateGame(req.params.id, req.body);
      res.json({ success: true, data: game, message: 'Game updated' });
    } catch (error) {
      next(error);
    }
  }

  async deleteGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await gameService.deleteGame(req.params.id);
      res.json({ success: true, message: 'Game deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const gameController = new GameController();
