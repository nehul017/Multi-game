import type { SlotSymbolDef } from './types';

export const FRUIT_SLOT_SYMBOLS: readonly SlotSymbolDef[] = [
  {
    id: 'cherry',
    name: 'Cherry',
    asset: 'cherry',
    weight: 28,
    rarity: 'common',
    payouts: { 3: 2, 4: 5, 5: 15 },
  },
  {
    id: 'lemon',
    name: 'Lemon',
    asset: 'lemon',
    weight: 24,
    rarity: 'common',
    payouts: { 3: 3, 4: 8, 5: 20 },
  },
  {
    id: 'orange',
    name: 'Orange',
    asset: 'orange',
    weight: 20,
    rarity: 'common',
    payouts: { 3: 4, 4: 10, 5: 25 },
  },
  {
    id: 'grapes',
    name: 'Grapes',
    asset: 'grapes',
    weight: 14,
    rarity: 'uncommon',
    payouts: { 3: 6, 4: 15, 5: 40 },
  },
  {
    id: 'watermelon',
    name: 'Watermelon',
    asset: 'watermelon',
    weight: 10,
    rarity: 'uncommon',
    payouts: { 3: 8, 4: 20, 5: 60 },
  },
  {
    id: 'bell',
    name: 'Bell',
    asset: 'bell',
    weight: 6,
    rarity: 'rare',
    payouts: { 3: 15, 4: 40, 5: 120 },
  },
  {
    id: 'seven',
    name: 'Lucky 7',
    asset: 'seven',
    weight: 3,
    rarity: 'legendary',
    payouts: { 3: 30, 4: 100, 5: 500 },
  },
] as const;

export const SYMBOL_BY_ID: Readonly<Record<SlotSymbolDef['id'], SlotSymbolDef>> =
  FRUIT_SLOT_SYMBOLS.reduce(
    (acc, symbol) => {
      acc[symbol.id] = symbol;
      return acc;
    },
    {} as Record<SlotSymbolDef['id'], SlotSymbolDef>
  );
