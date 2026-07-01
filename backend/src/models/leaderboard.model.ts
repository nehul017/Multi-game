import mongoose, { Schema } from 'mongoose';
import { ILeaderboardDocument } from '../interfaces/leaderboard.interface';

const leaderboardSchema = new Schema<ILeaderboardDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gameType: { type: String, required: true },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'all_time'],
      required: true,
    },
    elo: { type: Number, default: 1000 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
  },
  { timestamps: true }
);

leaderboardSchema.index({ gameType: 1, period: 1, elo: -1 });
leaderboardSchema.index({ user: 1, gameType: 1, period: 1 }, { unique: true });
leaderboardSchema.index({ rank: 1 });

export const Leaderboard = mongoose.model<ILeaderboardDocument>('Leaderboard', leaderboardSchema);
