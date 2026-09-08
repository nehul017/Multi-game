import { FRUIT_SLOT_PAYLINES } from './paylines';
import { FRUIT_SLOT_SYMBOLS } from './symbols';
import { FRUIT_SLOTS_GAME_ID, type FruitSlotsConfig, type PublicFruitSlotsConfig } from './types';

export const FRUIT_SLOTS_CONFIG: FruitSlotsConfig = {
  gameId: FRUIT_SLOTS_GAME_ID,
  name: 'Classic Fruit Slots',
  reelCount: 5,
  rowCount: 3,
  minBet: 10,
  maxBet: 500,
  betStep: 5,
  betPresets: [10, 25, 50, 100, 250, 500],
  symbols: FRUIT_SLOT_SYMBOLS,
  paylines: FRUIT_SLOT_PAYLINES,
};

export const getPublicFruitSlotsConfig = (): PublicFruitSlotsConfig => ({
  gameId: FRUIT_SLOTS_CONFIG.gameId,
  name: FRUIT_SLOTS_CONFIG.name,
  reelCount: FRUIT_SLOTS_CONFIG.reelCount,
  rowCount: FRUIT_SLOTS_CONFIG.rowCount,
  minBet: FRUIT_SLOTS_CONFIG.minBet,
  maxBet: FRUIT_SLOTS_CONFIG.maxBet,
  betStep: FRUIT_SLOTS_CONFIG.betStep,
  betPresets: FRUIT_SLOTS_CONFIG.betPresets,
  symbols: FRUIT_SLOTS_CONFIG.symbols.map((symbol) => ({
    id: symbol.id,
    name: symbol.name,
    asset: symbol.asset,
    rarity: symbol.rarity,
    payouts: symbol.payouts,
  })),
  paylines: FRUIT_SLOTS_CONFIG.paylines.map((line) => ({
    id: line.id,
    name: line.name,
    pattern: line.pattern,
  })),
});
