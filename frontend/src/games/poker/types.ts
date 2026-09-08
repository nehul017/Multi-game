export const POKER_GAME_ID = 'poker';

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
export type PlayerStatus = 'waiting' | 'active' | 'folded' | 'all-in' | 'sitting-out' | 'winner';
export type PokerActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in' | 'draw';

export interface PokerCard {
  id: string;
  rank: string;
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs';
}

export interface AllowedAction {
  type: PokerActionType;
  amount?: number;
  min?: number;
  max?: number;
}

export interface PublicSeatPlayer {
  userId: string;
  username: string;
  avatar: string;
  seatIndex: number;
  chips: number;
  status: PlayerStatus;
  holeCards: PokerCard[] | null;
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

export interface PotState {
  id: string;
  amount: number;
  eligiblePlayerIds: string[];
  label: string;
}

export interface ShowdownWinner {
  userId: string;
  username: string;
  share: number;
  winType: 'high' | 'low' | 'high-low' | 'uncontested';
  handName?: string;
  lowHandName?: string;
  category?: string;
}

export interface ShowdownResult {
  pots: Array<{
    potId: string;
    label: string;
    amount: number;
    winners: ShowdownWinner[];
  }>;
  revealedPlayers: Array<{
    userId: string;
    username: string;
    holeCards: PokerCard[];
    handName?: string;
    lowHandName?: string;
    category?: string;
  }>;
  highWinners: string[];
  lowWinners: string[];
}

export interface PokerGameState {
  tableId: string;
  gameType: PokerGameType;
  name: string;
  phase: PokerStreet;
  street: PokerStreet;
  handId: string | null;
  handNumber: number;
  players: PublicSeatPlayer[];
  communityCards: PokerCard[];
  pot: number;
  sidePots: PotState[];
  currentPlayerId: string | null;
  dealerPosition: number;
  smallBlindPosition: number;
  bigBlindPosition: number;
  currentBet: number;
  minimumRaise: number;
  actionDeadline: number | null;
  myCards: PokerCard[];
  allowedActions: AllowedAction[];
  showdown: ShowdownResult | null;
  maxSeats: number;
  blinds: { small: number; big: number };
  buyIn: { min: number; max: number };
  fillBots: boolean;
  status: 'open' | 'playing' | 'closed';
}

export interface LobbySeat {
  username: string;
  chips: number;
  isBot: boolean;
  seatIndex: number;
}

export interface LobbyTable {
  tableId: string;
  name: string;
  gameType: PokerGameType;
  blinds: { small: number; big: number };
  buyIn: { min: number; max: number };
  playersSeated: number;
  maxSeats: number;
  status: string;
  fillBots: boolean;
  pot?: number;
  street?: string;
  handNumber?: number;
  players?: LobbySeat[];
}

export interface PokerVariantInfo {
  id: PokerGameType;
  name: string;
  tagline: string;
  description: string;
  holeCards: number;
  communityCards: number;
  bettingRounds: string[];
  evaluation: string;
  availableActions: string[];
  potHandling: string;
}

export interface PokerPublicConfig {
  gameId: string;
  name: string;
  variants: Record<PokerGameType, PokerVariantInfo>;
  seats: number[];
  defaultTimeoutMs: number;
}

export interface PokerHistoryItem {
  handId: string;
  tableId: string;
  gameType: PokerGameType;
  players: Array<{ userId: string; username: string; seatIndex: number }>;
  communityCards: string[];
  result: unknown;
  pots: unknown;
  actions: Array<{ userId: string; action: string; amount?: number; street: string; timestamp: string }>;
  startedAt: string;
  completedAt?: string;
}

export interface GameErrorPayload {
  code?: string;
  message: string;
  status?: number;
}

export const VARIANT_COPY: Record<PokerGameType, { name: string; tagline: string }> = {
  'texas-holdem': { name: "Texas Hold'em", tagline: 'The classic. Two hole cards.' },
  omaha: { name: 'Omaha', tagline: 'Four hole cards. Use exactly two.' },
  'omaha-hi-lo': { name: 'Omaha Hi-Lo', tagline: 'High plus low. Split pot.' },
  'five-card-draw': { name: '5 Card Draw', tagline: 'Draw your cards. Classic poker.' },
};
