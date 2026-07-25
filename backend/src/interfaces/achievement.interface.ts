import { Document } from 'mongoose';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface IAchievementCondition {
  type: string;
  value: number;
  gameType?: string;
}

export interface IAchievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  condition: IAchievementCondition;
  xpReward: number;
  coinReward: number;
  rarity: AchievementRarity;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAchievementDocument extends Omit<IAchievement, '_id'>, Document {}
