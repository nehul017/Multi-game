import { isTen } from '../cards';
import {
  botUnitRng,
  bySuit,
  cheapWinner,
  highest,
  lowest,
  nonTens,
  opponentIsWinning,
  partnerIsWinning,
  pickRandom,
  safeDiscard,
  tens,
  trickHasTen,
  winningCards,
} from './strategy';
import type { MindiBotView, MindiCard, Suit } from '../types';

const remainingInSuit = (view: MindiBotView, suit: Suit): number => {
  const seen = [
    ...view.playedCards,
    ...view.currentTrick.map((played) => played.card),
    ...view.hand,
  ].filter((card) => card.suit === suit).length;
  return Math.max(0, 13 - seen);
};

const protectTens = (cards: MindiCard[]): MindiCard[] => {
  const safe = nonTens(cards);
  return safe.length ? safe : cards;
};

export const pickHardCard = (view: MindiBotView): MindiCard | null => {
  const legal = view.legalCards;
  if (!legal.length) return null;
  const trump = view.trumpSuit;
  const endgame = view.completedTricks.length >= 9;

  if (!view.currentTrick.length) {
    const remainingTens = view.remainingTens;
    const safeLeads = protectTens(legal).filter((card) => !trump || card.suit !== trump || remainingInSuit(view, card.suit) <= 2);
    if (endgame && remainingTens.length && trump) {
      const trumpWinners = bySuit(legal, trump).sort((a, b) => b.value - a.value);
      if (trumpWinners.length && remainingInSuit(view, trump) <= trumpWinners.length + 1) {
        return trumpWinners[0];
      }
    }
    const pool = safeLeads.length ? safeLeads : protectTens(legal);
    return botUnitRng(view, 'hard-lead') < 0.85 ? lowest(pool) : pickRandom(pool, botUnitRng(view, 'hard-lead-r'));
  }

  const winners = winningCards(view, legal);
  const tenOnTable = trickHasTen(view);
  const partnerWins = partnerIsWinning(view);
  const opponentWins = opponentIsWinning(view);

  if (tenOnTable && winners.length) {
    const nonTrumpWinners = trump ? winners.filter((card) => card.suit !== trump) : winners;
    return cheapWinner(nonTrumpWinners.length ? nonTrumpWinners : winners);
  }

  if (partnerWins && !tenOnTable) {
    return safeDiscard(view, legal);
  }

  if (opponentWins && winners.length) {
    const myTens = tens(winners);
    if (myTens.length && view.currentTrick.length === 3) return myTens[0];
    const cheap = cheapWinner(winners);
    if (cheap && (!trump || cheap.suit !== trump || tenOnTable || endgame)) return cheap;
  }

  if (winners.length && view.currentTrick.length === 3) {
    return cheapWinner(winners);
  }

  const voidDiscard = safeDiscard(view, legal);
  if (trump && voidDiscard.suit === trump && !tenOnTable && !endgame) {
    const nonTrump = legal.filter((card) => card.suit !== trump);
    if (nonTrump.length) return safeDiscard(view, nonTrump);
  }

  const myTen = tens(legal)[0];
  if (myTen && winners.includes(myTen) && view.currentTrick.length === 3) {
    return myTen;
  }

  if (endgame && winners.length) {
    return highest(winners);
  }

  return voidDiscard;
};
