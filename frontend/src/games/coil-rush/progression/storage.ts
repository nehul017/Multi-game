import { COIL_STORAGE } from '../config';

export interface CoilLocalStats {
  games: number;
  food: number;
  kills: number;
  wins: number;
}

const EMPTY: CoilLocalStats = { games: 0, food: 0, kills: 0, wins: 0 };

export const coilProgress = {
  getSkin(): string {
    if (typeof window === 'undefined') return 'ember';
    return window.localStorage.getItem(COIL_STORAGE.skin) || 'fire';
  },
  setSkin(id: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(COIL_STORAGE.skin, id);
  },
  getBest(): number {
    if (typeof window === 'undefined') return 0;
    return Number(window.localStorage.getItem(COIL_STORAGE.best) || 0);
  },
  setBest(score: number): number {
    if (typeof window === 'undefined') return score;
    const best = Math.max(this.getBest(), score);
    window.localStorage.setItem(COIL_STORAGE.best, String(best));
    return best;
  },
  getStats(): CoilLocalStats {
    if (typeof window === 'undefined') return EMPTY;
    try {
      return { ...EMPTY, ...JSON.parse(window.localStorage.getItem(COIL_STORAGE.stats) || '{}') };
    } catch {
      return EMPTY;
    }
  },
  recordRun(input: { score: number; food: number; kills: number; won?: boolean }) {
    const next: CoilLocalStats = {
      games: this.getStats().games + 1,
      food: this.getStats().food + input.food,
      kills: this.getStats().kills + input.kills,
      wins: this.getStats().wins + (input.won ? 1 : 0),
    };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COIL_STORAGE.stats, JSON.stringify(next));
    }
    return next;
  },
};
