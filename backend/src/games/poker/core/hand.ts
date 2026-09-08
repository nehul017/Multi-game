import type { Card } from './card';

export const HAND_CATEGORIES = [
  'high-card',
  'one-pair',
  'two-pair',
  'three-of-a-kind',
  'straight',
  'flush',
  'full-house',
  'four-of-a-kind',
  'straight-flush',
  'royal-flush',
] as const;

export type HandCategory = (typeof HAND_CATEGORIES)[number];

export const HAND_RANK: Record<HandCategory, number> = {
  'high-card': 1,
  'one-pair': 2,
  'two-pair': 3,
  'three-of-a-kind': 4,
  straight: 5,
  flush: 6,
  'full-house': 7,
  'four-of-a-kind': 8,
  'straight-flush': 9,
  'royal-flush': 10,
};

export const HAND_LABEL: Record<HandCategory, string> = {
  'high-card': 'High Card',
  'one-pair': 'One Pair',
  'two-pair': 'Two Pair',
  'three-of-a-kind': 'Three of a Kind',
  straight: 'Straight',
  flush: 'Flush',
  'full-house': 'Full House',
  'four-of-a-kind': 'Four of a Kind',
  'straight-flush': 'Straight Flush',
  'royal-flush': 'Royal Flush',
};

export interface EvaluatedHand {
  category: HandCategory;
  rank: number;
  ranks: number[];
  cards: Card[];
  name: string;
}

export const compareEvaluatedHands = (a: EvaluatedHand, b: EvaluatedHand): number => {
  if (a.rank !== b.rank) return a.rank - b.rank;
  const len = Math.max(a.ranks.length, b.ranks.length);
  for (let i = 0; i < len; i += 1) {
    const delta = (a.ranks[i] || 0) - (b.ranks[i] || 0);
    if (delta !== 0) return delta;
  }
  return 0;
};

export const RANK_NAME: Record<number, string> = {
  1: 'Ace',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten',
  11: 'Jack',
  12: 'Queen',
  13: 'King',
  14: 'Ace',
};

export const formatRankName = (value: number, plural = false): string => {
  const name = RANK_NAME[value] || String(value);
  if (!plural) return name;
  if (name === 'Six') return 'Sixes';
  return `${name}s`;
};
