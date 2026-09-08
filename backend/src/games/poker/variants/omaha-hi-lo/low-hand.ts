import { lowRankValue, type Card } from '../../core/card';
import { combinations } from '../../core/evaluator';

export interface EvaluatedLowHand {
  ranks: number[];
  cards: Card[];
  name: string;
}

const LOW_LABEL: Record<number, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
};

export const formatLowHand = (ranksAsc: number[]): string =>
  ranksAsc.map((rank) => LOW_LABEL[rank] || String(rank)).join('-');

export const evaluateFiveLow = (cards: Card[]): EvaluatedLowHand | null => {
  if (cards.length !== 5) return null;
  const values = cards.map((card) => lowRankValue(card.rank));
  if (new Set(values).size !== 5) return null;
  if (values.some((value) => value < 1 || value > 8)) return null;
  const ranksAsc = [...values].sort((a, b) => a - b);
  return {
    ranks: [...ranksAsc].reverse(),
    cards,
    name: formatLowHand(ranksAsc),
  };
};

export const compareLowHands = (a: EvaluatedLowHand, b: EvaluatedLowHand): number => {
  for (let i = 0; i < 5; i += 1) {
    const delta = b.ranks[i] - a.ranks[i];
    if (delta !== 0) return delta;
  }
  return 0;
};

export const evaluateOmahaLow = (hole: Card[], community: Card[]): EvaluatedLowHand | null => {
  if (hole.length < 2 || community.length < 3) return null;
  let best: EvaluatedLowHand | null = null;
  for (const holePair of combinations(hole, 2)) {
    for (const board of combinations(community, 3)) {
      const next = evaluateFiveLow([...holePair, ...board]);
      if (!next) continue;
      if (!best || compareLowHands(next, best) > 0) best = next;
    }
  }
  return best;
};
