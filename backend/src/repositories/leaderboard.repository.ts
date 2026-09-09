import { SCORE_LEADERBOARD_GAMES } from '../games/core/result-validator';
import { BaseRepository } from './base.repository';
import { Leaderboard } from '../models/leaderboard.model';
import { ILeaderboardDocument } from '../interfaces/leaderboard.interface';
import { LeaderboardPeriod } from '../interfaces/leaderboard.interface';

class LeaderboardRepository extends BaseRepository<ILeaderboardDocument> {
  constructor() {
    super(Leaderboard);
  }

  async getLeaderboard(gameType: string, period: LeaderboardPeriod, page: number, limit: number): Promise<{ data: ILeaderboardDocument[]; total: number; page: number; pages: number }> {
    const sort = SCORE_LEADERBOARD_GAMES.has(gameType) ? '-score' : '-elo';
    return this.findMany({ gameType, period }, { page, limit, sort, populate: 'user' });
  }

  async getUserEntry(userId: string, gameType: string, period: LeaderboardPeriod = 'all_time'): Promise<ILeaderboardDocument | null> {
    return this.model.findOne({ user: userId, gameType, period }).exec();
  }

  async upsertEntry(userId: string, gameType: string, period: LeaderboardPeriod, data: Partial<ILeaderboardDocument>): Promise<ILeaderboardDocument> {
    return this.model.findOneAndUpdate(
      { user: userId, gameType, period },
      { $set: data, $setOnInsert: { user: userId, gameType, period } },
      { new: true, upsert: true, runValidators: true }
    ).exec() as Promise<ILeaderboardDocument>;
  }

  async recalculateRanks(
    gameType: string,
    period: LeaderboardPeriod,
    rankBy: 'elo' | 'score' = 'elo'
  ): Promise<void> {
    const entries = await this.model.find({ gameType, period }).sort({ [rankBy]: -1 }).exec();
    const bulkOps = entries.map((entry, index) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: { rank: index + 1 },
      },
    }));
    if (bulkOps.length > 0) {
      await this.model.bulkWrite(bulkOps);
    }
  }

  async getRank(userId: string, gameType: string, period: LeaderboardPeriod = 'all_time'): Promise<number> {
    const userEntry = await this.getUserEntry(userId, gameType, period);
    if (!userEntry) return 0;
    const higherCount = await this.model.countDocuments({
      gameType,
      period,
      elo: { $gt: userEntry.elo },
    });
    return higherCount + 1;
  }
}

export const leaderboardRepository = new LeaderboardRepository();
