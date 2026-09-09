import { createHash } from 'crypto';
import { isTen } from '../cards';
import { compareTrickCards, currentWinningSeat, leadSuitOf } from '../legal-moves';
import type { MindiBotView, MindiCard, Suit } from '../types';

export const botUnitRng = (view: MindiBotView, salt: string): number => {
  const digest = createHash('sha256')
    .update(`${view.playerId}:${view.moveNumber}:${view.roundNumber}:${salt}`)
    .digest();
  return digest.readUInt32LE(0) / 4294967296;
};

export const pickRandom = (cards: MindiCard[], rng: number): MindiCard =>
  cards[Math.min(cards.length - 1, Math.floor(rng * cards.length))];

export const lowest = (cards: MindiCard[]): MindiCard =>
  [...cards].sort((a, b) => a.value - b.value)[0];

export const highest = (cards: MindiCard[]): MindiCard =>
  [...cards].sort((a, b) => b.value - a.value)[0];

export const bySuit = (cards: MindiCard[], suit: Suit): MindiCard[] =>
  cards.filter((card) => card.suit === suit);

export const nonTens = (cards: MindiCard[]): MindiCard[] => cards.filter((card) => !isTen(card));

export const tens = (cards: MindiCard[]): MindiCard[] => cards.filter((card) => isTen(card));

export const winningCards = (view: MindiBotView, cards: MindiCard[]): MindiCard[] => {
  if (!view.currentTrick.length) return [];
  const lead = leadSuitOf(view.currentTrick);
  if (!lead) return [];
  const currentBest = view.currentTrick.reduce((best, played) => {
    const cmp = compareTrickCards(played.card, best.card, lead, view.trumpSuit);
    return cmp > 0 ? played : best;
  });
  return cards.filter((card) => compareTrickCards(card, currentBest.card, lead, view.trumpSuit) > 0);
};

export const partnerIsWinning = (view: MindiBotView): boolean => {
  const seat = currentWinningSeat(view.currentTrick, view.trumpSuit);
  return seat === view.partnerSeat;
};

export const opponentIsWinning = (view: MindiBotView): boolean => {
  const seat = currentWinningSeat(view.currentTrick, view.trumpSuit);
  return seat !== null && seat !== view.seat && seat !== view.partnerSeat;
};

export const trickHasTen = (view: MindiBotView): boolean =>
  view.currentTrick.some((played) => isTen(played.card));

export const cheapWinner = (cards: MindiCard[]): MindiCard | null => {
  if (!cards.length) return null;
  return lowest(cards);
};

export const safeDiscard = (view: MindiBotView, cards: MindiCard[]): MindiCard => {
  const safe = nonTens(cards);
  if (safe.length) {
    const nonTrump = view.trumpSuit ? safe.filter((card) => card.suit !== view.trumpSuit) : safe;
    return lowest(nonTrump.length ? nonTrump : safe);
  }
  return lowest(cards);
};
