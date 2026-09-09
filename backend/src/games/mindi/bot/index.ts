import { pickEasyCard } from './easy';
import { pickMediumCard } from './medium';
import { pickHardCard } from './hard';
import type { Mindi } from '../engine';
import type { MindiCard } from '../types';

export { BOT_THINK_MS, DEFAULT_BOT_DIFFICULTY, botThinkDelay, resolveBotDifficulty } from './config';

export const getBotMove = (engine: Mindi, playerId: string): Record<string, unknown> | null => {
  const view = engine.getBotView(playerId);
  if (!view) return null;

  if (view.phase === 'trump_selection') {
    const counts = view.hand.reduce<Record<string, number>>((acc, card) => {
      acc[card.suit] = (acc[card.suit] || 0) + 1;
      return acc;
    }, {});
    const suit = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    return suit ? { action: 'select-trump', suit } : null;
  }

  let card: MindiCard | null = null;
  if (view.difficulty === 'easy') card = pickEasyCard(view);
  else if (view.difficulty === 'hard') card = pickHardCard(view);
  else card = pickMediumCard(view);

  if (!card) return null;
  if (!view.legalCards.some((legal) => legal.id === card!.id)) {
    card = view.legalCards[0] || null;
  }
  if (!card) return null;
  return { action: 'play-card', cardId: card.id };
};
