import { gameRepository } from '../repositories/game.repository';
import { AppError } from '../utils/AppError';
import { IGameDocument } from '../interfaces/game.interface';

class GameService {
  async createGame(data: Partial<IGameDocument>): Promise<IGameDocument> {
    const existing = await gameRepository.findBySlug(data.slug || '');
    if (existing) throw new AppError('Game with this slug already exists', 409);
    return gameRepository.create(data);
  }

  async getGames(page: number = 1, limit: number = 100) {
    return gameRepository.findMany({ isActive: true }, { page, limit, sort: 'name' });
  }

  async getGameBySlug(slug: string): Promise<IGameDocument> {
    const game = await gameRepository.findBySlug(slug);
    if (!game) throw new AppError('Game not found', 404);
    return game;
  }

  async getGameById(id: string): Promise<IGameDocument> {
    const game = await gameRepository.findById(id);
    if (!game) throw new AppError('Game not found', 404);
    return game;
  }

  async updateGame(id: string, data: Partial<IGameDocument>): Promise<IGameDocument> {
    const game = await gameRepository.updateById(id, data);
    if (!game) throw new AppError('Game not found', 404);
    return game;
  }

  async deleteGame(id: string): Promise<void> {
    const game = await gameRepository.deleteById(id);
    if (!game) throw new AppError('Game not found', 404);
  }

  async getActiveGames(): Promise<IGameDocument[]> {
    return gameRepository.findActiveGames();
  }

  async getGamesByCategory(category: string): Promise<IGameDocument[]> {
    return gameRepository.findByCategory(category);
  }
}

export const gameService = new GameService();
