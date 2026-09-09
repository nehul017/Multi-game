export type MindiSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type MindiRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type MindiTeam = 'A' | 'B';
export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface MindiCard {
  id: string;
  suit: MindiSuit;
  rank: MindiRank;
  value: number;
}

export interface MindiPlayedCard {
  seat: number;
  playerId: string;
  card: MindiCard;
}

export interface MindiCompletedTrick {
  trickNumber: number;
  cards: MindiPlayedCard[];
  winnerSeat: number;
  winnerPlayerId: string;
  winningCard: MindiCard;
  team: MindiTeam;
  tens: MindiCard[];
}

export interface MindiSeat {
  seat: number;
  playerId: string;
  team: MindiTeam;
  cardCount: number;
  isBot: boolean;
  isDealer: boolean;
  isLeader: boolean;
}

export interface MindiBoard {
  phase?: string;
  seats?: MindiSeat[];
  currentTrick?: MindiPlayedCard[];
  lastTrick?: MindiCompletedTrick | null;
  completedTrickCount?: number;
  tricksWon?: Record<MindiTeam, number>;
  capturedTens?: Record<MindiTeam, number>;
  capturedTenCards?: Record<MindiTeam, MindiCard[]>;
  trumpSuit?: MindiSuit | null;
  trumpRevealed?: boolean;
  dealerSeat?: number;
  leaderSeat?: number;
  currentSeat?: number;
  roundNumber?: number;
  moveNumber?: number;
  winnerTeam?: MindiTeam | null;
  winReason?: string | null;
  isMendikot?: boolean;
  isWhitewash?: boolean;
  botThinkingSeat?: number | null;
  mySeat?: number | null;
  myHand?: MindiCard[];
  legalCardIds?: string[];
}

export type MindiCardState =
  | 'normal'
  | 'playable'
  | 'selected'
  | 'disabled'
  | 'played'
  | 'winning'
  | 'hidden';

export type MindiSeatSlot = 'top' | 'left' | 'right' | 'bottom';

export const SUIT_GLYPH: Record<MindiSuit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const SUIT_LABEL: Record<MindiSuit, string> = {
  hearts: 'Hearts',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
  spades: 'Spades',
};

export const SUIT_PATH: Record<MindiSuit, string> = {
  spades:
    'M12 2C9 7 5.5 10.2 5.5 13.4c0 2.6 1.9 4.2 4.1 4.4-.3 1.1-.9 2.1-1.9 2.8h8.6c-1-.7-1.6-1.7-1.9-2.8 2.2-.2 4.1-1.8 4.1-4.4C18.5 10.2 15 7 12 2z',
  hearts:
    'M12 21S3.2 14.4 3.2 8.8C3.2 5.9 5.4 4 8 4c1.7 0 3.2.9 4 2.2C12.8 4.9 14.3 4 16 4c2.6 0 4.8 1.9 4.8 4.8C20.8 14.4 12 21 12 21z',
  diamonds: 'M12 2l7 10-7 10-7-10 7-10z',
  clubs:
    'M12 3.2c-1.9 0-3.5 1.6-3.5 3.6 0 .6.1 1.1.4 1.6-1.7-.3-3.3.9-3.3 2.7 0 1.8 1.5 3.1 3.3 3.1.5 0 1-.1 1.4-.3-.2 1.1-.8 2.1-1.8 2.8h6.9c-1-.7-1.6-1.7-1.8-2.8.4.2.9.3 1.4.3 1.8 0 3.3-1.3 3.3-3.1 0-1.8-1.6-3-3.3-2.7.3-.5.4-1 .4-1.6 0-2-1.6-3.6-3.5-3.6z',
};

export const isRedSuit = (suit: MindiSuit): boolean => suit === 'hearts' || suit === 'diamonds';
