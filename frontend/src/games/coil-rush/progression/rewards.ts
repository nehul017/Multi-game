import type { CoilRunStats } from '../types';
import { coilProgress } from './storage';

export function closeRun(stats: Omit<CoilRunStats, 'bestScore' | 'isRecord'>): CoilRunStats {
  const previous = coilProgress.getBest();
  const bestScore = coilProgress.setBest(stats.score);
  coilProgress.recordRun({
    score: stats.score,
    food: stats.foodEaten,
    kills: stats.kills,
    won: stats.rank === 1,
  });
  return {
    ...stats,
    bestScore,
    isRecord: stats.score > previous,
  };
}

export const COIL_MISSIONS = [
  { id: 'eat-40', title: 'Graze the ring', detail: 'Eat 40 pellets in any mode', reward: '40 coins · 20 XP', progress: 0.45 },
  { id: 'live-90', title: 'Hold the line', detail: 'Survive 90 seconds', reward: '60 coins · 30 XP', progress: 0.2 },
  { id: 'cut-3', title: 'Three cuts', detail: 'Eliminate 3 rival coils', reward: '80 coins · 40 XP', progress: 0.1 },
  { id: 'len-60', title: 'Long current', detail: 'Reach length 60', reward: 'Tide Line skin', progress: 0.35 },
  { id: 'win-2', title: 'Twin surge', detail: 'Win 2 matches this week', reward: '120 coins · 80 XP', progress: 0 },
];
