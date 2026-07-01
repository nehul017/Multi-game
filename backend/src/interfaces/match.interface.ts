import { Document } from 'mongoose';

export interface IMatchPlayer {
  userId: string;
  elo: number;
  result: 'win' | 'loss' | 'draw' | 'pending';
}

export interface IMatchMove {
  player: string;
  action: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export type MatchStatus = 'waiting' | 'playing' | 'finished' | 'draw' | 'aborted';

export interface IMatch {
  _id: string;
  gameType: string;
  players: IMatchPlayer[];
  roomId: string;
  moves: IMatchMove[];
  winner: string | null;
  status: MatchStatus;
  spectators: string[];
  startedAt: Date | null;
  finishedAt: Date | null;
  replayData: Record<string, unknown>;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMatchDocument extends Omit<IMatch, '_id'>, Document {}
