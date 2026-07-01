import { Document } from 'mongoose';

export interface IGameSettings {
  timeLimit?: number;
  maxMoves?: number;
  boardSize?: number;
  difficulty?: string;
  [key: string]: unknown;
}

export interface IGame {
  _id: string;
  name: string;
  slug: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  isActive: boolean;
  settings: IGameSettings;
  thumbnail: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGameDocument extends Omit<IGame, '_id'>, Document {}
