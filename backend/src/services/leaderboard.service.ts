import { SCORE_LEADERBOARD_GAMES } from '../games/core/result-validator';
import { leaderboardRepository } from '../repositories/leaderboard.repository';
import { userRepository } from '../repositories/user.repository';
import { LeaderboardPeriod } from '../interfaces/leaderboard.interface';
import { ELO, XP_REWARDS } from '../utils/constants';
import { calculateLevel } from '../utils/helpers';

class LeaderboardService {
  async getLeaderboard(gameType: string, period: LeaderboardPeriod = 'all_time', page: number = 1, limit: number = 20) {
    return leaderboardRepository.getLeaderboard(gameType, period, page, limit);
  }

  async updateLeaderboard(
    userId: string,
    gameType: string,
    result: 'win' | 'loss' | 'draw',
    opponentElo: number
  ): Promise<void> {
    const periods: LeaderboardPeriod[] = ['daily', 'weekly', 'monthly', 'all_time'];

    for (const period of periods) {
      let entry = await leaderboardRepository.getUserEntry(userId, gameType, period);
      const user = await userRepository.findById(userId);
      if (!user) continue;

      const currentElo = entry?.elo || user.elo;
      const newElo = this.calculateElo(currentElo, opponentElo, result);

      const wins = (entry?.wins || 0) + (result === 'win' ? 1 : 0);
      const losses = (entry?.losses || 0) + (result === 'loss' ? 1 : 0);
      const draws = (entry?.draws || 0) + (result === 'draw' ? 1 : 0);
      const total = wins + losses + draws;
      const winRate = total > 0 ? (wins / total) * 100 : 0;

      let xpGain = XP_REWARDS.GAME_PLAYED;
      if (result === 'win') xpGain += XP_REWARDS.WIN;
      else if (result === 'loss') xpGain += XP_REWARDS.LOSS;
      else xpGain += XP_REWARDS.DRAW;

      const newXp = (entry?.xp || user.xp) + xpGain;
      const newLevel = calculateLevel(newXp);

      await leaderboardRepository.upsertEntry(userId, gameType, period, {
        elo: newElo,
        wins,
        losses,
        draws,
        winRate: parseFloat(winRate.toFixed(2)),
        xp: newXp,
        level: newLevel,
      } as any);

      // Sync global profile from the general leaderboard only (avoids double XP/ELO)
      if (period === 'all_time' && gameType === 'general') {
        await userRepository.updateById(userId, {
          elo: newElo,
          xp: newXp,
          level: newLevel,
        } as any);
      }

      await leaderboardRepository.recalculateRanks(gameType, period);
    }
  }

  async recordHighScore(userId: string, gameType: string, score: number): Promise<void> {
    if (!Number.isFinite(score) || score <= 0) return;
    const periods: LeaderboardPeriod[] = ['daily', 'weekly', 'monthly', 'all_time'];
    const user = await userRepository.findById(userId);
    if (!user) return;

    for (const period of periods) {
      const entry = await leaderboardRepository.getUserEntry(userId, gameType, period);
      const nextScore = Math.max(Number(entry?.score || 0), Math.floor(score));
      await leaderboardRepository.upsertEntry(userId, gameType, period, {
        elo: SCORE_LEADERBOARD_GAMES.has(gameType) ? nextScore : entry?.elo || user.elo,
        score: nextScore,
        wins: entry?.wins || 0,
        losses: entry?.losses || 0,
        draws: entry?.draws || 0,
        winRate: entry?.winRate || 0,
        xp: entry?.xp || user.xp,
        level: entry?.level || user.level,
      } as never);
      await leaderboardRepository.recalculateRanks(
        gameType,
        period,
        SCORE_LEADERBOARD_GAMES.has(gameType) ? 'score' : 'elo'
      );
    }
  }

  async getRank(userId: string, gameType: string, period: LeaderboardPeriod = 'all_time'): Promise<number> {
    return leaderboardRepository.getRank(userId, gameType, period);
  }

  calculateElo(playerElo: number, opponentElo: number, result: 'win' | 'loss' | 'draw'): number {
    let kFactor: number;
    if (playerElo < 1200) {
      kFactor = ELO.K_FACTOR_NEW;
    } else if (playerElo >= ELO.HIGH_ELO_THRESHOLD) {
      kFactor = ELO.K_FACTOR_HIGH;
    } else {
      kFactor = ELO.K_FACTOR_STANDARD;
    }

    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));

    let actualScore: number;
    switch (result) {
      case 'win':
        actualScore = 1;
        break;
      case 'loss':
        actualScore = 0;
        break;
      case 'draw':
        actualScore = 0.5;
        break;
    }

    const newElo = Math.round(playerElo + kFactor * (actualScore - expectedScore));
    return Math.max(0, newElo);
  }
}

export const leaderboardService = new LeaderboardService();
