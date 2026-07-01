import { BaseRepository } from './base.repository';
import { Game } from '../models/game.model';
import { IGameDocument } from '../interfaces/game.interface';

class GameRepository extends BaseRepository<IGameDocument> {
  constructor() {
    super(Game);
  }

  async findBySlug(slug: string): Promise<IGameDocument | null> {
    return this.model.findOne({ slug }).exec();
  }

  async findActiveGames(): Promise<IGameDocument[]> {
    return this.model.find({ isActive: true }).sort({ name: 1 }).exec();
  }

  async findByCategory(category: string): Promise<IGameDocument[]> {
    return this.model.find({ category, isActive: true }).exec();
  }

  async searchGames(query: string): Promise<IGameDocument[]> {
    return this.model
      .find({ $text: { $search: query }, isActive: true })
      .sort({ score: { $meta: 'textScore' } })
      .exec();
  }
}

export const gameRepository = new GameRepository();
