import type { BotDifficulty } from '../types';

export const DEFAULT_BOT_DIFFICULTY: BotDifficulty = 'medium';

export const BOT_THINK_MS: Record<BotDifficulty, { min: number; max: number }> = {
  easy: { min: 800, max: 1400 },
  medium: { min: 900, max: 1700 },
  hard: { min: 1000, max: 1900 },
};

export const botThinkDelay = (difficulty: BotDifficulty, rng: () => number = Math.random): number => {
  const range = BOT_THINK_MS[difficulty] || BOT_THINK_MS.medium;
  return range.min + Math.floor(rng() * (range.max - range.min + 1));
};

export const resolveBotDifficulty = (value: unknown): BotDifficulty => {
  if (value === 'easy' || value === 'medium' || value === 'hard') return value;
  return DEFAULT_BOT_DIFFICULTY;
};
