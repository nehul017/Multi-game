import { BaseRepository } from './base.repository';
import { Mission, UserMissionProgress } from '../models/mission.model';
import { IMissionDocument, IUserMissionProgressDocument, MissionType } from '../interfaces/economy.interface';

class MissionRepository extends BaseRepository<IMissionDocument> {
  constructor() {
    super(Mission);
  }

  async findActiveByType(type: MissionType) {
    return this.model.find({ type, isActive: true }).exec();
  }

  async findAllActive() {
    return this.model.find({ isActive: true }).sort({ type: 1, createdAt: 1 }).exec();
  }
}

class UserMissionProgressRepository extends BaseRepository<IUserMissionProgressDocument> {
  constructor() {
    super(UserMissionProgress);
  }

  async getOrCreate(userId: string, missionId: string, periodKey: string) {
    let progress = await this.model.findOne({ userId, missionId, periodKey }).exec();
    if (!progress) {
      progress = await this.model.create({
        userId,
        missionId,
        periodKey,
        progress: 0,
        completed: false,
        claimed: false,
      });
    }
    return progress;
  }

  async findForUserPeriod(userId: string, periodKeys: string[]) {
    return this.model
      .find({ userId, periodKey: { $in: periodKeys } })
      .populate('missionId')
      .exec();
  }
}

export const missionRepository = new MissionRepository();
export const userMissionProgressRepository = new UserMissionProgressRepository();
