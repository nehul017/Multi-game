import { lowest, nonTens, pickRandom, botUnitRng } from './strategy';
import type { MindiBotView, MindiCard } from '../types';

export const pickEasyCard = (view: MindiBotView): MindiCard | null => {
  const legal = view.legalCards;
  if (!legal.length) return null;
  const lowSafe = nonTens(legal);
  const pool = lowSafe.length && botUnitRng(view, 'easy-pool') < 0.75 ? lowSafe : legal;
  if (botUnitRng(view, 'easy-low') < 0.7) return lowest(pool);
  return pickRandom(pool, botUnitRng(view, 'easy-rand'));
};
