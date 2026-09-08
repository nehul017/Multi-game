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

export interface SlotSymbolDef {
  id: SymbolId;
  name: string;
  asset: string;
  weight: number;
  payouts: SymbolPayouts;
  rarity: SymbolRarity;
}

export interface PaylineDef {
  id: string;
  name: string;
  /** Row index (0 = top) for each reel, left to right. */
  pattern: readonly number[];
}

export interface FruitSlotsConfig {
  gameId: typeof FRUIT_SLOTS_GAME_ID;
  name: string;
  reelCount: number;
  rowCount: number;
  minBet: number;
  maxBet: number;
  betStep: number;
  betPresets: readonly number[];
  symbols: readonly SlotSymbolDef[];
  paylines: readonly PaylineDef[];
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

export interface SpinOutcome {
  reels: ReelGrid;
  winningLines: WinningLine[];
  winAmount: number;
}

export type RandomFn = () => number;

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
  gameId: typeof FRUIT_SLOTS_GAME_ID;
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
