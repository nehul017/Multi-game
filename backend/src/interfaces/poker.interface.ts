import { Document } from 'mongoose';
import type { PokerGameType, PokerStreet } from '../games/poker/core/game-state';

export interface IPokerTable {
  tableId: string;
  name: string;
  gameType: PokerGameType;
  maxSeats: number;
  smallBlind: number;
  bigBlind: number;
  buyInMin: number;
  buyInMax: number;
  actionTimeoutMs: number;
  fillBots: boolean;
  status: 'open' | 'playing' | 'closed';
  seatedCount: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPokerTableDocument extends IPokerTable, Document {}

export interface IPokerHand {
  handId: string;
  tableId: string;
  gameType: PokerGameType;
  players: Array<{
    userId: string;
    username: string;
    seatIndex: number;
    startingChips: number;
    endingChips?: number;
  }>;
  dealerPosition: number;
  blinds: { small: number; big: number };
  communityCards: string[];
  result?: unknown;
  pots?: unknown;
  startedAt: Date;
  completedAt?: Date;
}

export interface IPokerHandDocument extends IPokerHand, Document {}

export interface IPokerAction {
  handId: string;
  tableId: string;
  userId: string;
  action: string;
  amount?: number;
  street: PokerStreet;
  timestamp: Date;
}

export interface IPokerActionDocument extends IPokerAction, Document {}

export interface IPokerPlayerSession {
  tableId: string;
  userId: string;
  username: string;
  seatIndex: number;
  buyIn: number;
  chips: number;
  status: 'seated' | 'left';
  joinedAt: Date;
  leftAt?: Date;
}

export interface IPokerPlayerSessionDocument extends IPokerPlayerSession, Document {}
