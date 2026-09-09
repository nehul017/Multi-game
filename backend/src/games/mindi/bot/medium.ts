import {
  cheapWinner,
  lowest,
  partnerIsWinning,
  safeDiscard,
  tens,
  trickHasTen,
  winningCards,
} from './strategy';
import type { MindiBotView, MindiCard } from '../types';

export const pickMediumCard = (view: MindiBotView): MindiCard | null => {
  const legal = view.legalCards;
  if (!legal.length) return null;

  if (!view.currentTrick.length) {
    const tenIds = new Set(tens(legal).map((card) => card.id));
    const safeLead = legal.filter((card) => !tenIds.has(card.id) || legal.length === 1);
    return lowest(safeLead.length ? safeLead : legal);
  }

  if (partnerIsWinning(view) && !trickHasTen(view)) {
    return safeDiscard(view, legal);
  }

  const winners = winningCards(view, legal);
  if (winners.length && (trickHasTen(view) || !partnerIsWinning(view))) {
    const cheap = cheapWinner(winners);
    if (cheap) return cheap;
  }

  return safeDiscard(view, legal);
};
