import { missionRepository, userMissionProgressRepository } from '../repositories/mission.repository';
import { economyService } from './economy.service';
import { AppError } from '../utils/AppError';
import { MissionConditionType, MissionType } from '../interfaces/economy.interface';
import { notificationService } from './notification.service';
import { calculateLevel } from '../utils/helpers';
import { userRepository } from '../repositories/user.repository';

const getPeriodKey = (type: MissionType): string => {
  const now = new Date();
  if (type === 'daily') {
    return `daily:${now.toISOString().slice(0, 10)}`;
  }
  const start = new Date(now);
  const day = start.getDay();
  const diff = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diff);
  return `weekly:${start.toISOString().slice(0, 10)}`;
};

class MissionService {
  async getUserMissions(userId: string) {
    const missions = await missionRepository.findAllActive();
    const periodKeys = Array.from(new Set(missions.map((m) => getPeriodKey(m.type))));

    const result = [];
    for (const mission of missions) {
      const periodKey = getPeriodKey(mission.type);
      const progress = await userMissionProgressRepository.getOrCreate(
        userId,
        mission._id.toString(),
        periodKey
      );

      result.push({
        id: mission._id,
        title: mission.title,
        description: mission.description,
        type: mission.type,
        condition: mission.condition,
        coinReward: mission.coinReward,
        xpReward: mission.xpReward,
        progress: progress.progress,
        target: mission.condition.value,
        completed: progress.completed,
        claimed: progress.claimed,
        periodKey,
      });
    }

    return result;
  }

  async trackProgress(
    userId: string,
    conditionType: MissionConditionType,
    amount = 1,
    gameType?: string
  ): Promise<void> {
    const missions = await missionRepository.findAllActive();
    const relevant = missions.filter(
      (m) =>
        m.condition.type === conditionType &&
        (!m.condition.gameType || !gameType || m.condition.gameType === gameType)
    );

    for (const mission of relevant) {
      const periodKey = getPeriodKey(mission.type);
      const progress = await userMissionProgressRepository.getOrCreate(
        userId,
        mission._id.toString(),
        periodKey
      );

      if (progress.claimed || progress.completed) continue;

      progress.progress = Math.min(progress.progress + amount, mission.condition.value);
      if (progress.progress >= mission.condition.value) {
        progress.completed = true;
      }
      await progress.save();
    }
  }

  async claimMission(userId: string, missionId: string) {
    const mission = await missionRepository.findById(missionId);
    if (!mission || !mission.isActive) throw new AppError('Mission not found', 404);

    const periodKey = getPeriodKey(mission.type);
    const progress = await userMissionProgressRepository.getOrCreate(userId, missionId, periodKey);

    if (!progress.completed) throw new AppError('Mission not completed yet', 400);
    if (progress.claimed) throw new AppError('Mission reward already claimed', 400);

    progress.claimed = true;
    await progress.save();

    const coinResult = await economyService.creditCoins(
      userId,
      mission.coinReward,
      'mission',
      `Mission reward: ${mission.title}`,
      { missionId, type: mission.type }
    );

    const user = await userRepository.findById(userId);
    if (user && mission.xpReward > 0) {
      const newXp = (user.xp || 0) + mission.xpReward;
      await userRepository.updateById(userId, {
        xp: newXp,
        level: calculateLevel(newXp),
      } as any);
    }

    await notificationService.create(
      userId,
      'system',
      'Mission Complete',
      `Claimed ${mission.coinReward} coins from "${mission.title}"`,
      { missionId, coins: mission.coinReward }
    );

    return {
      coins: coinResult.coins,
      coinReward: mission.coinReward,
      xpReward: mission.xpReward,
      mission: { id: mission._id, title: mission.title },
    };
  }

  async createMission(data: Record<string, unknown>) {
    return missionRepository.create(data as any);
  }

  async updateMission(id: string, data: Record<string, unknown>) {
    const mission = await missionRepository.updateById(id, data as any);
    if (!mission) throw new AppError('Mission not found', 404);
    return mission;
  }

  async deleteMission(id: string) {
    const mission = await missionRepository.deleteById(id);
    if (!mission) throw new AppError('Mission not found', 404);
    return mission;
  }

  async getAllMissionsAdmin() {
    return missionRepository.findMany({}, { page: 1, limit: 100, sort: 'type' });
  }
}

export const missionService = new MissionService();
