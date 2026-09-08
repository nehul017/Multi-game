import type { SeatPlayer } from './player';
import type { PotState } from './game-state';

export const buildPots = (players: SeatPlayer[]): PotState[] => {
  const contributors = players.filter((player) => player.committed > 0);
  if (contributors.length === 0) return [];

  const levels = [...new Set(contributors.map((player) => player.committed))].sort((a, b) => a - b);
  const pots: PotState[] = [];
  let previous = 0;

  for (const level of levels) {
    const inLevel = contributors.filter((player) => player.committed >= level);
    const amount = (level - previous) * inLevel.length;
    const eligiblePlayerIds = inLevel
      .filter((player) => player.status !== 'folded')
      .map((player) => player.userId);

    if (amount > 0) {
      pots.push({
        id: `pot-${pots.length}`,
        amount,
        eligiblePlayerIds,
        label: pots.length === 0 ? 'MAIN POT' : `SIDE POT ${pots.length}`,
      });
    }
    previous = level;
  }

  return pots;
};

export const totalPot = (pots: PotState[]): number => pots.reduce((sum, pot) => sum + pot.amount, 0);

export const splitEvenly = (amount: number, winnerCount: number): number[] => {
  if (winnerCount <= 0) return [];
  const base = Math.floor(amount / winnerCount);
  const remainder = amount - base * winnerCount;
  return Array.from({ length: winnerCount }, (_, index) => base + (index < remainder ? 1 : 0));
};

export const splitHighLow = (amount: number): { high: number; low: number } => {
  const high = Math.ceil(amount / 2);
  return { high, low: amount - high };
};
