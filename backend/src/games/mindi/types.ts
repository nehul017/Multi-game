export const MINDI_SEAT_COUNT = 4;
export const MINDI_HAND_SIZE = 13;
export const MINDI_TRICK_SIZE = 4;
export const MINDI_GAME_TYPE = 'mindi';

export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];
export type TeamId = 'A' | 'B';
export type BotDifficulty = 'easy' | 'medium' | 'hard';

export type MindiPhase =
  | 'waiting'
  | 'starting'
  | 'dealing'
  | 'trump_selection'
  | 'playing'
  | 'trick_complete'
  | 'round_complete'
  | 'game_complete'
  | 'paused'
  | 'abandoned';

export type TrumpMode = 'dealer-last-card-shown' | 'dealer-last-card-hidden' | 'chooser';
export type FirstPlayerMode = 'left-of-dealer';

export interface MindiCard {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
}

export interface MindiRules {
  trumpMode: TrumpMode;
  followSuitRequired: boolean;
  canPlayAnyWhenVoid: boolean;
  tensToWin: number;
  splitTensDecidedByTricks: boolean;
  tricksToWinSplit: number;
  dealsToWin: number;
  firstPlayer: FirstPlayerMode;
  rankOrder: Rank[];
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
  team: TeamId;
  tens: MindiCard[];
}

export interface MindiSeatPublic {
  seat: number;
  playerId: string;
  team: TeamId;
  cardCount: number;
  isBot: boolean;
  isDealer: boolean;
  isLeader: boolean;
}

export interface MindiPublicBoard {
  phase: MindiPhase;
  seats: MindiSeatPublic[];
  currentTrick: MindiPlayedCard[];
  lastTrick: MindiCompletedTrick | null;
  completedTrickCount: number;
  tricksWon: Record<TeamId, number>;
  capturedTens: Record<TeamId, number>;
  capturedTenCards: Record<TeamId, MindiCard[]>;
  trumpSuit: Suit | null;
  trumpRevealed: boolean;
  dealerSeat: number;
  leaderSeat: number;
  currentSeat: number;
  roundNumber: number;
  moveNumber: number;
  winnerTeam: TeamId | null;
  winReason: string | null;
  isMendikot: boolean;
  isWhitewash: boolean;
  botThinkingSeat: number | null;
}

export interface MindiAuthorizedBoard extends MindiPublicBoard {
  mySeat: number | null;
  myHand: MindiCard[];
  legalCardIds: string[];
}

export interface MindiBotView {
  playerId: string;
  seat: number;
  team: TeamId;
  partnerSeat: number;
  hand: MindiCard[];
  legalCards: MindiCard[];
  currentTrick: MindiPlayedCard[];
  leadSuit: Suit | null;
  trumpSuit: Suit | null;
  trumpRevealed: boolean;
  playedCards: MindiCard[];
  remainingTens: Suit[];
  capturedTens: Record<TeamId, number>;
  tricksWon: Record<TeamId, number>;
  completedTricks: MindiCompletedTrick[];
  phase: MindiPhase;
  roundNumber: number;
  moveNumber: number;
  difficulty: BotDifficulty;
}

export interface MindiSettings {
  deckSeed?: string;
  dealerSeat?: number;
  botDifficulty?: BotDifficulty;
  rules?: Partial<MindiRules>;
  testDeck?: MindiCard[];
}
