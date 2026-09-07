const HIGH_SCORE_KEY = 'block-master-high-score';

export const blockMasterStorage = {
  getHighScore(): number {
    if (typeof window === 'undefined') return 0;
    const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  },

  setHighScore(score: number): number {
    const next = Math.max(this.getHighScore(), Math.floor(score));
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(HIGH_SCORE_KEY, String(next));
    }
    return next;
  },
};
