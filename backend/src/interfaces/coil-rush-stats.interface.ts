import { Document, Types } from 'mongoose';

export interface ICoilRushStats {
  user: Types.ObjectId;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  highestScore: number;
  highestLength: number;
  playersEliminated: number;
  totalSurvivalTimeMs: number;
  favoriteSkin: string;
  bestRank: number;
  lastPlayedAt: Date;
}

export interface ICoilRushStatsDocument extends ICoilRushStats, Document {}
