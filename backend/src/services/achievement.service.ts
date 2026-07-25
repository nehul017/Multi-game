import { achievementRepository } from '../repositories/achievement.repository';
import { userRepository } from '../repositories/user.repository';
import { notificationService } from './notification.service';
import { AppError } from '../utils/AppError';
import { gameEvents, EVENTS } from '../events';
import { economyService } from './economy.service';
import { COIN_REWARDS } from '../utils/constants';

interface AchievementEvent {
  type: string;
  value: number;
  gameType?: string;
}

class AchievementService {
  async checkAchievements(userId: string, event: AchievementEvent): Promise<string[]> {
    const user = await userRepository.findById(userId);
    if (!user) return [];

    const achievements = await achievementRepository.findByConditionType(event.type);
    const unlocked: string[] = [];

    for (const achievement of achievements) {
      const alreadyHas = user.achievements.some(
        (a) => a.toString() === achievement._id.toString()
      );
      if (alreadyHas) continue;

      if (achievement.condition.gameType && achievement.condition.gameType !== event.gameType) {
        continue;
      }

      let meetsCondition = false;

      switch (event.type) {
        case 'wins':
          meetsCondition = user.wins >= achievement.condition.value;
          break;
        case 'games_played':
          meetsCondition = user.gamesPlayed >= achievement.condition.value;
          break;
        case 'elo':
          meetsCondition = user.elo >= achievement.condition.value;
          break;
        case 'level':
          meetsCondition = user.level >= achievement.condition.value;
          break;
        case 'friends':
          meetsCondition = user.friends.length >= achievement.condition.value;
          break;
        case 'win_streak':
          meetsCondition = event.value >= achievement.condition.value;
          break;
        default:
          meetsCondition = event.value >= achievement.condition.value;
      }

      if (meetsCondition) {
        await this.awardAchievement(userId, achievement._id.toString());
        unlocked.push(achievement._id.toString());
      }
    }

    return unlocked;
  }

  async awardAchievement(userId: string, achievementId: string): Promise<void> {
    const achievement = await achievementRepository.findById(achievementId);
    if (!achievement) throw new AppError('Achievement not found', 404);

    await userRepository.addAchievement(userId, achievementId);
    await userRepository.addXp(userId, achievement.xpReward);

    const coinReward =
      (achievement as { coinReward?: number }).coinReward ?? COIN_REWARDS.ACHIEVEMENT_DEFAULT;
    if (coinReward > 0) {
      await economyService.creditCoins(
        userId,
        coinReward,
        'achievement',
        `Achievement reward: ${achievement.name}`,
        { achievementId }
      );
    }

    await notificationService.create(
      userId,
      'achievement',
      'Achievement Unlocked!',
      `You earned "${achievement.name}" - ${achievement.description}`,
      { achievementId, xpReward: achievement.xpReward, coinReward }
    );

    gameEvents.emit(EVENTS.ACHIEVEMENT_UNLOCKED, { userId, achievementId });
  }

  async getAchievements(userId?: string) {
    const allAchievements = await achievementRepository.getAll();

    if (userId) {
      const user = await userRepository.findById(userId);
      if (!user) throw new AppError('User not found', 404);

      return allAchievements.map((a) => ({
        ...a.toObject(),
        unlocked: user.achievements.some((ua) => ua.toString() === a._id.toString()),
      }));
    }

    return allAchievements;
  }

  async getUserAchievements(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const allAchievements = await achievementRepository.getAll();
    return allAchievements.filter((a) =>
      user.achievements.some((ua) => ua.toString() === a._id.toString())
    );
  }
}

export const achievementService = new AchievementService();
