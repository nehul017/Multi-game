const HIGH_SCORE_KEY = 'jigsaw-world-high-score';
const COMPLETED_KEY = 'jigsaw-world-completed';

export interface CompletedPuzzle {
  puzzleId: string;
  difficulty: string;
  score: number;
  durationMs: number;
  at: number;
}

function completedKey(puzzleId: string, difficulty: string): string {
  return `${puzzleId}:${difficulty}`;
}

export const jigsawStorage = {
  getHighScore(): number {
    if (typeof window === 'undefined') return 0;
    const value = Number(window.localStorage.getItem(HIGH_SCORE_KEY));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  },

  setHighScore(score: number): number {
    const next = Math.max(this.getHighScore(), Math.floor(score));
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(HIGH_SCORE_KEY, String(next));
    }
    return next;
  },

  getCompleted(): Record<string, CompletedPuzzle> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = window.localStorage.getItem(COMPLETED_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, CompletedPuzzle>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  },

  markCompleted(entry: CompletedPuzzle): void {
    if (typeof window === 'undefined') return;
    const all = this.getCompleted();
    const key = completedKey(entry.puzzleId, entry.difficulty);
    const prev = all[key];
    if (!prev || entry.score > prev.score) {
      all[key] = entry;
      window.localStorage.setItem(COMPLETED_KEY, JSON.stringify(all));
    }
  },

  isCompleted(puzzleId: string, difficulty: string): boolean {
    return Boolean(this.getCompleted()[completedKey(puzzleId, difficulty)]);
  },
};
