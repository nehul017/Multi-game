import { BaseRepository } from './base.repository';
import { Achievement } from '../models/achievement.model';
import { IAchievementDocument } from '../interfaces/achievement.interface';

class AchievementRepository extends BaseRepository<IAchievementDocument> {
  constructor() {
    super(Achievement);
  }

  async findByCategory(category: string): Promise<IAchievementDocument[]> {
    return this.model.find({ category }).exec();
  }

  async findByConditionType(type: string): Promise<IAchievementDocument[]> {
    return this.model.find({ 'condition.type': type }).exec();
  }

  async findByRarity(rarity: string): Promise<IAchievementDocument[]> {
    return this.model.find({ rarity }).exec();
  }

  async getAll(): Promise<IAchievementDocument[]> {
    return this.model.find().sort({ rarity: 1, name: 1 }).exec();
  }
}

export const achievementRepository = new AchievementRepository();
