import { RANK_VALUE, type Card } from './card';
import {
  compareEvaluatedHands,
  formatRankName,
  HAND_LABEL,
  HAND_RANK,
  type EvaluatedHand,
  type HandCategory,
} from './hand';

export const combinations = <T>(items: T[], size: number): T[][] => {
  if (size < 0 || size > items.length) return [];
  if (size === 0) return [[]];
  const result: T[][] = [];
  const walk = (start: number, chosen: T[]) => {
    if (chosen.length === size) {
      result.push(chosen.slice());
      return;
    }
    for (let i = start; i <= items.length - (size - chosen.length); i += 1) {
      chosen.push(items[i]);
      walk(i + 1, chosen);
      chosen.pop();
    }
  };
  walk(0, []);
  return result;
};

const rankCounts = (values: number[]): Array<[number, number]> => {
  const counts = new Map<number, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
};

const straightHigh = (uniqueDesc: number[]): number | null => {
  if (uniqueDesc.length !== 5) return null;
  if (uniqueDesc[0] - uniqueDesc[4] === 4) return uniqueDesc[0];
  if (
    uniqueDesc[0] === 14 &&
    uniqueDesc[1] === 5 &&
    uniqueDesc[2] === 4 &&
    uniqueDesc[3] === 3 &&
    uniqueDesc[4] === 2
  ) {
    return 5;
  }
  return null;
};

const describeHand = (category: HandCategory, ranks: number[]): string => {
  switch (category) {
    case 'royal-flush':
      return 'Royal Flush';
    case 'straight-flush':
      return ranks[0] === 5 ? 'Steel Wheel' : `${formatRankName(ranks[0])}-High Straight Flush`;
    case 'four-of-a-kind':
      return `Four of a Kind, ${formatRankName(ranks[0], true)}`;
    case 'full-house':
      return `Full House, ${formatRankName(ranks[0], true)} over ${formatRankName(ranks[1], true)}`;
    case 'flush':
      return `${formatRankName(ranks[0])}-High Flush`;
    case 'straight':
      return ranks[0] === 5 ? 'Wheel Straight' : `${formatRankName(ranks[0])}-High Straight`;
    case 'three-of-a-kind':
      return `Three of a Kind, ${formatRankName(ranks[0], true)}`;
    case 'two-pair':
      return `Two Pair, ${formatRankName(ranks[0], true)} and ${formatRankName(ranks[1], true)}`;
    case 'one-pair':
      return `Pair of ${formatRankName(ranks[0], true)}`;
    default:
      return `${formatRankName(ranks[0])} High`;
  }
};

export const evaluateFive = (cards: Card[]): EvaluatedHand => {
  if (cards.length !== 5) {
    throw new Error('evaluateFive requires exactly five cards');
  }

  const values = cards.map((card) => RANK_VALUE[card.rank]).sort((a, b) => b - a);
  const isFlush = cards.every((card) => card.suit === cards[0].suit);
  const unique = [...new Set(values)];
  const highStraight = straightHigh(unique);
  const isStraight = highStraight !== null;
  const groups = rankCounts(values);

  let category: HandCategory;
  let ranks: number[];

  if (isStraight && isFlush) {
    category = highStraight === 14 ? 'royal-flush' : 'straight-flush';
    ranks = [highStraight as number];
  } else if (groups[0][1] === 4) {
    category = 'four-of-a-kind';
    ranks = [groups[0][0], groups[1][0]];
  } else if (groups[0][1] === 3 && groups[1]?.[1] === 2) {
    category = 'full-house';
    ranks = [groups[0][0], groups[1][0]];
  } else if (isFlush) {
    category = 'flush';
    ranks = values;
  } else if (isStraight) {
    category = 'straight';
    ranks = [highStraight as number];
  } else if (groups[0][1] === 3) {
    category = 'three-of-a-kind';
    ranks = [groups[0][0], ...groups.slice(1).map((group) => group[0])];
  } else if (groups[0][1] === 2 && groups[1]?.[1] === 2) {
    category = 'two-pair';
    const pairs = [groups[0][0], groups[1][0]].sort((a, b) => b - a);
    ranks = [...pairs, groups[2][0]];
  } else if (groups[0][1] === 2) {
    category = 'one-pair';
    ranks = [groups[0][0], ...groups.slice(1).map((group) => group[0])];
  } else {
    category = 'high-card';
    ranks = values;
  }

  return {
    category,
    rank: HAND_RANK[category],
    ranks,
    cards,
    name: describeHand(category, ranks),
  };
};

const bestFromCombos = (combos: Card[][]): EvaluatedHand => {
  if (combos.length === 0) {
    throw new Error('No combinations available to evaluate');
  }
  return combos.reduce((best, combo) => {
    const next = evaluateFive(combo);
    return compareEvaluatedHands(next, best) > 0 ? next : best;
  }, evaluateFive(combos[0]));
};

export const evaluateHoldEm = (hole: Card[], community: Card[]): EvaluatedHand => {
  const pool = [...hole, ...community];
  if (pool.length < 5) {
    throw new Error('Hold\'em evaluation requires at least five cards');
  }
  return bestFromCombos(combinations(pool, 5));
};

export const evaluateOmahaHigh = (hole: Card[], community: Card[]): EvaluatedHand => {
  if (hole.length < 2 || community.length < 3) {
    throw new Error('Omaha evaluation requires at least 2 hole cards and 3 community cards');
  }
  const holeCombos = combinations(hole, 2);
  const boardCombos = combinations(community, 3);
  const combos: Card[][] = [];
  for (const holePair of holeCombos) {
    for (const board of boardCombos) {
      combos.push([...holePair, ...board]);
    }
  }
  return bestFromCombos(combos);
};

export const evaluateFiveCardDraw = (hole: Card[]): EvaluatedHand => {
  if (hole.length !== 5) {
    throw new Error('Five Card Draw evaluation requires exactly five hole cards');
  }
  return evaluateFive(hole);
};

export { compareEvaluatedHands, HAND_LABEL, HAND_RANK };
