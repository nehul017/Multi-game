import { Document, Types } from 'mongoose';
import type { ReelGrid, WinningLine } from '../games/fruit-slots/types';

export type GameSessionStatus = 'active' | 'left';

export interface IGameSession {
  _id: string;
  userId: Types.ObjectId | string;
  gameId: string;
  status: GameSessionStatus;
  lastBet: number;
  lastWin: number;
  lastReels: ReelGrid | null;
  lastWinningLines: WinningLine[];
  lastSpinId: string | null;
  lastRequestId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGameSessionDocument extends Omit<IGameSession, '_id'>, Document {}

export interface ISpin {
  _id: string;
  userId: Types.ObjectId | string;
  gameId: string;
  sessionId: Types.ObjectId | string;
  requestId: string;
  bet: number;
  reels: ReelGrid;
  winningLines: WinningLine[];
  winAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISpinDocument extends Omit<ISpin, '_id'>, Document {}
