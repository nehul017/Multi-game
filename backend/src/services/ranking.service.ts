import { ELO, RANK_TIERS } from '../utils/constants';
import { calculateLevel, xpForLevel, getRankTier } from '../utils/helpers';

export interface EloResult {
  newPlayerElo: number;
  newOpponentElo: number;
  playerEloChange: number;
  opponentEloChange: number;
}

export interface RankInfo {
  tier: string;
  elo: number;
  nextTier: string | null;
  eloToNextTier: number;
  progress: number;
}

class RankingService {
  calculateElo(playerElo: number, opponentElo: number, result: 'win' | 'loss' | 'draw'): EloResult {
    const playerK = this.getKFactor(playerElo);
    const opponentK = this.getKFactor(opponentElo);

    const playerExpected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    const opponentExpected = 1 - playerExpected;

    let playerActual: number;
    let opponentActual: number;

    switch (result) {
      case 'win':
        playerActual = 1;
        opponentActual = 0;
        break;
      case 'loss':
        playerActual = 0;
        opponentActual = 1;
        break;
      case 'draw':
        playerActual = 0.5;
        opponentActual = 0.5;
        break;
    }

    const newPlayerElo = Math.max(0, Math.round(playerElo + playerK * (playerActual - playerExpected)));
    const newOpponentElo = Math.max(0, Math.round(opponentElo + opponentK * (opponentActual - opponentExpected)));

    return {
      newPlayerElo,
      newOpponentElo,
      playerEloChange: newPlayerElo - playerElo,
      opponentEloChange: newOpponentElo - opponentElo,
    };
  }

  calculateXp(result: 'win' | 'loss' | 'draw', opponentElo: number, playerElo: number): number {
    let baseXp: number;
    switch (result) {
      case 'win':
        baseXp = 50;
        break;
      case 'loss':
        baseXp = 10;
        break;
      case 'draw':
        baseXp = 25;
        break;
    }

    const eloDiff = opponentElo - playerElo;
    const multiplier = result === 'win'
      ? Math.max(1, 1 + eloDiff / 400)
      : 1;

    return Math.round(baseXp * multiplier);
  }

  calculateLevel(xp: number): number {
    return calculateLevel(xp);
  }

  xpForLevel(level: number): number {
    return xpForLevel(level);
  }

  xpProgress(xp: number): { currentLevel: number; currentLevelXp: number; nextLevelXp: number; progress: number } {
    const currentLevel = this.calculateLevel(xp);
    const currentLevelXp = this.xpForLevel(currentLevel);
    const nextLevelXp = this.xpForLevel(currentLevel + 1);
    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

    return {
      currentLevel,
      currentLevelXp,
      nextLevelXp,
      progress: parseFloat(progress.toFixed(1)),
    };
  }

  calculateWinRate(wins: number, totalGames: number): number {
    if (totalGames === 0) return 0;
    return parseFloat(((wins / totalGames) * 100).toFixed(2));
  }

  getRankInfo(elo: number): RankInfo {
    const tier = getRankTier(elo);
    const tiers = Object.values(RANK_TIERS);
    const currentTierIndex = tiers.findIndex((t) => t.name === tier);
    const currentTier = tiers[currentTierIndex];
    const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;

    let progress = 0;
    let eloToNext = 0;

    if (nextTier && currentTier) {
      const tierRange = currentTier.max - currentTier.min;
      const tierProgress = elo - currentTier.min;
      progress = parseFloat(((tierProgress / tierRange) * 100).toFixed(1));
      eloToNext = nextTier.min - elo;
    }

    return {
      tier,
      elo,
      nextTier: nextTier?.name || null,
      eloToNextTier: eloToNext,
      progress,
    };
  }

  private getKFactor(elo: number): number {
    if (elo < 1200) return ELO.K_FACTOR_NEW;
    if (elo >= ELO.HIGH_ELO_THRESHOLD) return ELO.K_FACTOR_HIGH;
    return ELO.K_FACTOR_STANDARD;
  }
}

export const rankingService = new RankingService();
