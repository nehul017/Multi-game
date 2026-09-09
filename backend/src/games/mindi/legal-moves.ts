import { isTen } from './cards';
import { teamForSeat } from './rules';
import type {
  MindiCard,
  MindiCompletedTrick,
  MindiPlayedCard,
  MindiRules,
  Suit,
  TeamId,
} from './types';

export const leadSuitOf = (trick: MindiPlayedCard[]): Suit | null => trick[0]?.card.suit ?? null;

export const getLegalMoves = (
  hand: MindiCard[],
  trick: MindiPlayedCard[],
  rules: MindiRules
): MindiCard[] => {
  if (!hand.length) return [];
  if (!rules.followSuitRequired || trick.length === 0) return [...hand];

  const lead = leadSuitOf(trick);
  if (!lead) return [...hand];

  const matching = hand.filter((card) => card.suit === lead);
  if (matching.length) return matching;
  return rules.canPlayAnyWhenVoid ? [...hand] : [];
};

export const validateMove = (
  hand: MindiCard[],
  trick: MindiPlayedCard[],
  cardId: string,
  rules: MindiRules
): { ok: true; card: MindiCard } | { ok: false; reason: string } => {
  const card = hand.find((entry) => entry.id === cardId);
  if (!card) {
    return { ok: false, reason: 'That card is no longer in your hand.' };
  }
  const legal = getLegalMoves(hand, trick, rules);
  if (!legal.some((entry) => entry.id === cardId)) {
    return { ok: false, reason: 'You cannot play that card.' };
  }
  return { ok: true, card };
};

export const compareTrickCards = (
  a: MindiCard,
  b: MindiCard,
  leadSuit: Suit,
  trumpSuit: Suit | null
): number => {
  const aTrump = trumpSuit !== null && a.suit === trumpSuit;
  const bTrump = trumpSuit !== null && b.suit === trumpSuit;
  if (aTrump !== bTrump) return aTrump ? 1 : -1;

  const aFollows = a.suit === leadSuit;
  const bFollows = b.suit === leadSuit;
  if (!aTrump && aFollows !== bFollows) return aFollows ? 1 : -1;

  return a.value - b.value;
};

export const getTrickWinner = (
  trick: MindiPlayedCard[],
  trumpSuit: Suit | null
): MindiPlayedCard => {
  if (trick.length !== 4) {
    throw new Error('A trick must contain 4 cards before it can be resolved');
  }
  const leadSuit = leadSuitOf(trick);
  if (!leadSuit) {
    throw new Error('Trick is missing a lead suit');
  }

  return trick.reduce((best, played) => {
    const cmp = compareTrickCards(played.card, best.card, leadSuit, trumpSuit);
    return cmp > 0 ? played : best;
  });
};

export const tensInTrick = (trick: MindiPlayedCard[]): MindiCard[] =>
  trick.filter((played) => isTen(played.card)).map((played) => played.card);

export const resolveRoundWinner = (
  capturedTens: Record<TeamId, number>,
  tricksWon: Record<TeamId, number>,
  rules: MindiRules
): { team: TeamId | null; reason: string; isMendikot: boolean; isWhitewash: boolean } => {
  const aTens = capturedTens.A;
  const bTens = capturedTens.B;
  const isMendikot = aTens === 4 || bTens === 4;
  const isWhitewash = tricksWon.A === 13 || tricksWon.B === 13;

  if (aTens >= rules.tensToWin && aTens > bTens) {
    return { team: 'A', reason: isMendikot ? 'mendikot' : 'tens', isMendikot, isWhitewash };
  }
  if (bTens >= rules.tensToWin && bTens > aTens) {
    return { team: 'B', reason: isMendikot ? 'mendikot' : 'tens', isMendikot, isWhitewash };
  }

  if (aTens === bTens && rules.splitTensDecidedByTricks) {
    if (tricksWon.A >= rules.tricksToWinSplit && tricksWon.A > tricksWon.B) {
      return { team: 'A', reason: 'tricks', isMendikot, isWhitewash };
    }
    if (tricksWon.B >= rules.tricksToWinSplit && tricksWon.B > tricksWon.A) {
      return { team: 'B', reason: 'tricks', isMendikot, isWhitewash };
    }
  }

  return { team: null, reason: 'draw', isMendikot, isWhitewash };
};

export const remainingTenSuits = (completed: MindiCompletedTrick[]): Suit[] => {
  const taken = new Set(completed.flatMap((trick) => trick.tens.map((card) => card.suit)));
  return (['hearts', 'diamonds', 'clubs', 'spades'] as Suit[]).filter((suit) => !taken.has(suit));
};

export const currentWinningSeat = (trick: MindiPlayedCard[], trumpSuit: Suit | null): number | null => {
  if (!trick.length) return null;
  const leadSuit = leadSuitOf(trick);
  if (!leadSuit) return null;
  return trick.reduce((best, played) => {
    const cmp = compareTrickCards(played.card, best.card, leadSuit, trumpSuit);
    return cmp > 0 ? played : best;
  }).seat;
};

export const teamOfPlayed = (played: MindiPlayedCard): TeamId => teamForSeat(played.seat);
