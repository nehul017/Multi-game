export const FRUIT_SLOTS_GAME_ID = 'classic-fruit-slots';

export type SymbolId =
  | 'cherry'
  | 'lemon'
  | 'orange'
  | 'grapes'
  | 'watermelon'
  | 'bell'
  | 'seven';

export type SymbolRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface SymbolPayouts {
  3: number;
  4: number;
  5: number;
}

export interface PublicSymbol {
  id: SymbolId;
  name: string;
  asset: string;
  rarity: SymbolRarity;
  payouts: SymbolPayouts;
}

export interface PublicPayline {
  id: string;
  name: string;
  pattern: readonly number[];
}

export interface PublicFruitSlotsConfig {
  gameId: string;
  name: string;
  reelCount: number;
  rowCount: number;
  minBet: number;
  maxBet: number;
  betStep: number;
  betPresets: readonly number[];
  symbols: PublicSymbol[];
  paylines: PublicPayline[];
}

export type ReelGrid = SymbolId[][];

export interface WinningLine {
  paylineId: string;
  paylineName: string;
  symbolId: SymbolId;
  count: number;
  cells: Array<{ reel: number; row: number }>;
  multiplier: number;
  payout: number;
}

export interface FruitSlotsState {
  gameId: string;
  sessionId: string;
  balance: number;
  currentBet: number;
  lastWin: number;
  lastReels: ReelGrid | null;
  lastWinningLines: WinningLine[];
  lastSpinId: string | null;
}

export interface FruitSlotsSpinResult {
  spinId: string;
  requestId: string;
  bet: number;
  reels: ReelGrid;
  winningLines: WinningLine[];
  winAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export interface FruitSlotsHistoryItem {
  spinId: string;
  bet: number;
  winAmount: number;
  reels: ReelGrid;
  winningLines: WinningLine[];
  balanceAfter: number;
  createdAt: string;
}

export interface GameErrorPayload {
  code?: string;
  message: string;
  status?: number;
}

export const DEFAULT_REELS: ReelGrid = [
  ['cherry', 'lemon', 'orange', 'grapes', 'watermelon'],
  ['bell', 'seven', 'cherry', 'lemon', 'orange'],
  ['grapes', 'watermelon', 'bell', 'seven', 'cherry'],
];
