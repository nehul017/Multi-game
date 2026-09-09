import { Document, Types } from 'mongoose';

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

export interface ILeaderboard {
  _id: string;
  user: Types.ObjectId;
  gameType: string;
  period: LeaderboardPeriod;
  elo: number;
  score?: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  rank: number;
  xp: number;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeaderboardDocument extends Omit<ILeaderboard, '_id'>, Document {}
