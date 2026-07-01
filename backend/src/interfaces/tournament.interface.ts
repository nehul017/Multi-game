import { Document, Types } from 'mongoose';

export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin';
export type TournamentStatus = 'upcoming' | 'registration' | 'in_progress' | 'completed' | 'cancelled';

export interface IBracketMatch {
  round: number;
  matchNumber: number;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  score1: number;
  score2: number;
  status: 'pending' | 'playing' | 'completed';
}

export interface ITournament {
  _id: string;
  name: string;
  description: string;
  gameType: string;
  format: TournamentFormat;
  status: TournamentStatus;
  maxParticipants: number;
  participants: Types.ObjectId[];
  brackets: IBracketMatch[];
  rounds: number;
  currentRound: number;
  startDate: Date;
  endDate: Date;
  createdBy: Types.ObjectId;
  prize: string;
  rules: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITournamentDocument extends Omit<ITournament, '_id'>, Document {}
