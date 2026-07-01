import mongoose, { Schema } from 'mongoose';
import { IAchievementDocument } from '../interfaces/achievement.interface';

const achievementSchema = new Schema<IAchievementDocument>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, default: '🏆' },
    category: { type: String, required: true, index: true },
    condition: {
      type: { type: String, required: true },
      value: { type: Number, required: true },
      gameType: { type: String },
    },
    xpReward: { type: Number, required: true, min: 0 },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
  },
  { timestamps: true }
);

export const Achievement = mongoose.model<IAchievementDocument>('Achievement', achievementSchema);
