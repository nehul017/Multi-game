import { rankingService } from '../../services/ranking.service';

describe('RankingService', () => {
  describe('calculateElo', () => {
    it('should increase winner ELO and decrease loser ELO', () => {
      const result = rankingService.calculateElo(1200, 1200, 'win');
      expect(result.newPlayerElo).toBeGreaterThan(1200);
      expect(result.newOpponentElo).toBeLessThan(1200);
    });

    it('should give more ELO for beating higher-rated opponent', () => {
      const result1 = rankingService.calculateElo(1200, 1500, 'win');
      const result2 = rankingService.calculateElo(1200, 1200, 'win');
      expect(result1.playerEloChange).toBeGreaterThan(result2.playerEloChange);
    });

    it('should give less ELO for beating lower-rated opponent', () => {
      const result1 = rankingService.calculateElo(1500, 1000, 'win');
      const result2 = rankingService.calculateElo(1500, 1500, 'win');
      expect(result1.playerEloChange).toBeLessThan(result2.playerEloChange);
    });

    it('should handle draw correctly', () => {
      const result = rankingService.calculateElo(1200, 1200, 'draw');
      expect(result.playerEloChange).toBe(0);
      expect(result.opponentEloChange).toBe(0);
    });

    it('should never go below 0 ELO', () => {
      const result = rankingService.calculateElo(10, 2000, 'loss');
      expect(result.newPlayerElo).toBeGreaterThanOrEqual(0);
    });

    it('should give equal but opposite ELO changes for equal-rated players', () => {
      const result = rankingService.calculateElo(1200, 1200, 'win');
      expect(result.playerEloChange).toBe(-result.opponentEloChange);
    });

    it('should handle loss correctly', () => {
      const result = rankingService.calculateElo(1400, 1400, 'loss');
      expect(result.newPlayerElo).toBeLessThan(1400);
      expect(result.newOpponentElo).toBeGreaterThan(1400);
    });
  });

  describe('calculateXp', () => {
    it('should give more XP for a win than a loss', () => {
      const winXp = rankingService.calculateXp('win', 1200, 1200);
      const lossXp = rankingService.calculateXp('loss', 1200, 1200);
      expect(winXp).toBeGreaterThan(lossXp);
    });

    it('should give more XP for beating a higher-rated player', () => {
      const xpHigh = rankingService.calculateXp('win', 1800, 1200);
      const xpEqual = rankingService.calculateXp('win', 1200, 1200);
      expect(xpHigh).toBeGreaterThan(xpEqual);
    });

    it('should give base XP for draw', () => {
      const drawXp = rankingService.calculateXp('draw', 1200, 1200);
      expect(drawXp).toBe(25);
    });

    it('should always return a positive integer', () => {
      const xp = rankingService.calculateXp('loss', 100, 2000);
      expect(xp).toBeGreaterThan(0);
      expect(Number.isInteger(xp)).toBe(true);
    });
  });

  describe('calculateLevel', () => {
    it('should return level 1 for 0 XP', () => {
      expect(rankingService.calculateLevel(0)).toBe(1);
    });

    it('should increase level with more XP', () => {
      const level1 = rankingService.calculateLevel(0);
      const level2 = rankingService.calculateLevel(10000);
      expect(level2).toBeGreaterThan(level1);
    });
  });

  describe('calculateWinRate', () => {
    it('should return 0 for no games', () => {
      expect(rankingService.calculateWinRate(0, 0)).toBe(0);
    });

    it('should return 100 for all wins', () => {
      expect(rankingService.calculateWinRate(10, 10)).toBe(100);
    });

    it('should return 50 for half wins', () => {
      expect(rankingService.calculateWinRate(5, 10)).toBe(50);
    });

    it('should return correct percentage', () => {
      expect(rankingService.calculateWinRate(3, 7)).toBeCloseTo(42.86, 1);
    });
  });

  describe('xpProgress', () => {
    it('should return valid progress data', () => {
      const progress = rankingService.xpProgress(500);
      expect(progress.currentLevel).toBeGreaterThanOrEqual(1);
      expect(progress.progress).toBeGreaterThanOrEqual(0);
      expect(progress.progress).toBeLessThanOrEqual(100);
      expect(progress.nextLevelXp).toBeGreaterThan(progress.currentLevelXp);
    });
  });

  describe('getRankInfo', () => {
    it('should return valid rank info', () => {
      const info = rankingService.getRankInfo(1200);
      expect(info.tier).toBeTruthy();
      expect(info.elo).toBe(1200);
    });

    it('should return lowest tier for new players', () => {
      const info = rankingService.getRankInfo(100);
      expect(info.tier).toBeTruthy();
      expect(info.nextTier).toBeTruthy();
    });
  });
});
