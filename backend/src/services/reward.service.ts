import { leaderboardService } from './leaderboard.service';
import { economyService } from './economy.service';
import { achievementService } from './achievement.service';
import { missionService } from './mission.service';
import { userRepository } from '../repositories/user.repository';
import { matchService } from './match.service';
import { COIN_REWARDS, XP_REWARDS } from '../utils/constants';

export interface MatchRewardSummary {
  userId: string;
  result: 'win' | 'loss' | 'draw';
  coins: number;
  xp: number;
  eloChange: number;
  newElo: number;
  newLevel: number;
  balance: number;
  achievements: string[];
}

class RewardService {
  async settleMatch(
    matchId: string,
    winnerId: string | null,
    reason: 'finished' | 'draw' | 'surrender' = 'finished'
  ): Promise<MatchRewardSummary[]> {
    const match = await matchService.getMatch(matchId);
    if (['finished', 'draw', 'aborted'].includes(match.status)) {
      return [];
    }

    const players = match.players.map((p) => ({
      userId:
        typeof p.userId === 'object' && p.userId !== null && '_id' in (p.userId as object)
          ? String((p.userId as { _id: unknown })._id)
          : p.userId.toString(),
      elo: p.elo,
    }));

    if (players.length < 1) return [];

    const beforeMap = new Map<string, { elo: number; xp: number; level: number }>();
    for (const player of players) {
      const user = await userRepository.findById(player.userId);
      beforeMap.set(player.userId, {
        elo: user?.elo ?? player.elo,
        xp: user?.xp ?? 0,
        level: user?.level ?? 1,
      });
    }

    if (reason === 'draw' || !winnerId) {
      await matchService.setDraw(matchId);
    } else {
      await matchService.setWinner(matchId, winnerId);
    }

    const summaries: MatchRewardSummary[] = [];

    for (const player of players) {
      const opponent = players.find((p) => p.userId !== player.userId);
      const result: 'win' | 'loss' | 'draw' =
        reason === 'draw' || !winnerId
          ? 'draw'
          : player.userId === winnerId
            ? 'win'
            : 'loss';

      const before = beforeMap.get(player.userId)!;

      await leaderboardService.updateLeaderboard(
        player.userId,
        match.gameType,
        result,
        opponent?.elo ?? 1000
      );
      await leaderboardService.updateLeaderboard(
        player.userId,
        'general',
        result,
        opponent?.elo ?? 1000
      );

      const coinAmount =
        result === 'win'
          ? COIN_REWARDS.WIN
          : result === 'draw'
            ? COIN_REWARDS.DRAW
            : COIN_REWARDS.LOSS;

      const coinResult = await economyService.rewardMatchResult(
        player.userId,
        result,
        matchId,
        match.gameType
      );
      await missionService.trackProgress(player.userId, 'earn_coins', coinAmount);

      let xpGain = XP_REWARDS.GAME_PLAYED;
      if (result === 'win') xpGain += XP_REWARDS.WIN;
      else if (result === 'loss') xpGain += XP_REWARDS.LOSS;
      else xpGain += XP_REWARDS.DRAW;

      const userAfter = await userRepository.findById(player.userId);
      let winStreak = userAfter?.winStreak || 0;
      let bestWinStreak = userAfter?.bestWinStreak || 0;

      if (result === 'win') {
        winStreak += 1;
        bestWinStreak = Math.max(bestWinStreak, winStreak);
      } else {
        winStreak = 0;
      }

      if (userAfter) {
        await userRepository.updateById(player.userId, { winStreak, bestWinStreak } as any);
      }

      await missionService.trackProgress(player.userId, 'games_played', 1, match.gameType);
      if (result === 'win') {
        await missionService.trackProgress(player.userId, 'wins', 1, match.gameType);
      }

      const unlocked: string[] = [];
      if (userAfter) {
        unlocked.push(
          ...(await achievementService.checkAchievements(player.userId, {
            type: 'wins',
            value: userAfter.wins,
            gameType: match.gameType,
          }))
        );
        unlocked.push(
          ...(await achievementService.checkAchievements(player.userId, {
            type: 'games_played',
            value: userAfter.gamesPlayed,
            gameType: match.gameType,
          }))
        );
        unlocked.push(
          ...(await achievementService.checkAchievements(player.userId, {
            type: 'elo',
            value: userAfter.elo,
          }))
        );
        unlocked.push(
          ...(await achievementService.checkAchievements(player.userId, {
            type: 'level',
            value: userAfter.level,
          }))
        );
        if (result === 'win') {
          unlocked.push(
            ...(await achievementService.checkAchievements(player.userId, {
              type: 'win_streak',
              value: winStreak,
            }))
          );
        }
      }

      summaries.push({
        userId: player.userId,
        result,
        coins: coinAmount,
        xp: xpGain,
        eloChange: (userAfter?.elo ?? before.elo) - before.elo,
        newElo: userAfter?.elo ?? before.elo,
        newLevel: userAfter?.level ?? before.level,
        balance: coinResult.coins,
        achievements: unlocked,
      });
    }

    return summaries;
  }
}

export const rewardService = new RewardService();
