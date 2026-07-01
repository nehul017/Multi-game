import { Request, Response, NextFunction } from 'express';
import { tournamentService } from '../services/tournament.service';

class TournamentController {
  async createTournament(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tournament = await tournamentService.createTournament(req.body, req.user!._id.toString());
      res.status(201).json({ success: true, data: tournament });
    } catch (error) {
      next(error);
    }
  }

  async getTournaments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20', status } = req.query;
      const result = await tournamentService.getTournaments(
        parseInt(page as string),
        parseInt(limit as string),
        status as string
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getTournament(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tournament = await tournamentService.getTournament(req.params.id);
      res.json({ success: true, data: tournament });
    } catch (error) {
      next(error);
    }
  }

  async joinTournament(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tournament = await tournamentService.joinTournament(req.params.id, req.user!._id.toString());
      res.json({ success: true, data: tournament, message: 'Joined tournament' });
    } catch (error) {
      next(error);
    }
  }

  async leaveTournament(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await tournamentService.leaveTournament(req.params.id, req.user!._id.toString());
      res.json({ success: true, message: 'Left tournament' });
    } catch (error) {
      next(error);
    }
  }

  async generateBrackets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tournament = await tournamentService.generateBrackets(req.params.id);
      res.json({ success: true, data: tournament });
    } catch (error) {
      next(error);
    }
  }

  async getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const results = await tournamentService.getResults(req.params.id);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  async deleteTournament(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await tournamentService.deleteTournament(req.params.id, req.user!._id.toString());
      res.json({ success: true, message: 'Tournament deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const tournamentController = new TournamentController();
