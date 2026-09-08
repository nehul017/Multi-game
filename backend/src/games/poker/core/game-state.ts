import type { Card } from './card';
import type { EvaluatedHand } from './hand';
import type { PlayerStatus, PokerActionType, SeatPlayer } from './player';

export type PokerGameType = 'texas-holdem' | 'omaha' | 'omaha-hi-lo' | 'five-card-draw';

export type PokerStreet =
  | 'waiting'
  | 'preflop'
  | 'flop'
  | 'turn'
  | 'river'
  | 'draw'
  | 'draw-betting'
  | 'showdown'
  | 'payout'
  | 'complete';

export type { PlayerStatus, PokerActionType };

export interface TableConfig {
  tableId: string;
  name: string;
  gameType: PokerGameType;
  maxSeats: number;
  minSeatsToStart: number;
  smallBlind: number;
  bigBlind: number;
  buyInMin: number;
  buyInMax: number;
  actionTimeoutMs: number;
  fillBots: boolean;
}

export interface PotState {
  id: string;
  amount: number;
  eligiblePlayerIds: string[];
  label: string;
}

export interface AllowedAction {
  type: PokerActionType;
  amount?: number;
  min?: number;
  max?: number;
}

export interface PokerActionInput {
  type: PokerActionType;
  amount?: number;
  discardIndexes?: number[];
}

export interface PotAward {
  potId: string;
  label: string;
  amount: number;
  winners: Array<{
    userId: string;
    username: string;
    share: number;
    winType: 'high' | 'low' | 'high-low' | 'uncontested';
    handName?: string;
    lowHandName?: string;
    category?: string;
  }>;
}

export interface RevealedPlayer {
  userId: string;
  username: string;
  holeCards: Card[];
  handName?: string;
  lowHandName?: string;
  category?: string;
  highHand?: EvaluatedHand;
}

export interface ShowdownResult {
  pots: PotAward[];
  revealedPlayers: RevealedPlayer[];
  highWinners: string[];
  lowWinners: string[];
}

export interface TableState {
  tableId: string;
  config: TableConfig;
  phase: PokerStreet;
  street: PokerStreet;
  handId: string | null;
  handNumber: number;
  players: SeatPlayer[];
  communityCards: Card[];
  deck: Card[];
  pot: number;
  sidePots: PotState[];
  currentPlayerId: string | null;
  dealerPosition: number;
  smallBlindPosition: number;
  bigBlindPosition: number;
  currentBet: number;
  minimumRaise: number;
  lastRaiseSize: number;
  lastFullRaise: boolean;
  actionDeadline: number | null;
  lastAggressorId: string | null;
  showdown: ShowdownResult | null;
  handStartedAt: number | null;
  createdAt: number;
  status: 'open' | 'playing' | 'closed';
}

export interface PublicSeatPlayer {
  userId: string;
  username: string;
  avatar: string;
  seatIndex: number;
  chips: number;
  status: PlayerStatus;
  holeCards: Card[] | null;
  holeCardCount: number;
  betThisStreet: number;
  committed: number;
  lastAction?: PokerActionType;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  isBot: boolean;
  revealed: boolean;
  sittingOut: boolean;
  hasDrawn: boolean;
}

export interface PublicTableState {
  tableId: string;
  gameType: PokerGameType;
  name: string;
  phase: PokerStreet;
  street: PokerStreet;
  handId: string | null;
  handNumber: number;
  players: PublicSeatPlayer[];
  communityCards: Card[];
  pot: number;
  sidePots: PotState[];
  currentPlayerId: string | null;
  dealerPosition: number;
  smallBlindPosition: number;
  bigBlindPosition: number;
  currentBet: number;
  minimumRaise: number;
  actionDeadline: number | null;
  myCards: Card[];
  allowedActions: AllowedAction[];
  showdown: ShowdownResult | null;
  maxSeats: number;
  blinds: { small: number; big: number };
  buyIn: { min: number; max: number };
  fillBots: boolean;
  status: 'open' | 'playing' | 'closed';
}

export const POKER_GAME_ID = 'poker';

export const GAME_TYPE_LABEL: Record<PokerGameType, string> = {
  'texas-holdem': "Texas Hold'em",
  omaha: 'Omaha',
  'omaha-hi-lo': 'Omaha Hi-Lo',
  'five-card-draw': '5 Card Draw',
};
