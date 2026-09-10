import { BaseRepository } from './base.repository';
import { Match } from '../models/match.model';
import { IMatchDocument } from '../interfaces/match.interface';
import { fillDailyCounts, getDateRange } from '../utils/helpers';

class MatchRepository extends BaseRepository<IMatchDocument> {
  constructor() {
    super(Match);
  }

  async findByRoomId(roomId: string): Promise<IMatchDocument | null> {
    return this.model.findOne({ roomId }).populate('players.userId', 'username avatar elo').exec();
  }

  async findByUser(userId: string, page: number, limit: number): Promise<{ data: IMatchDocument[]; total: number; page: number; pages: number }> {
    return this.findMany({ 'players.userId': userId }, { page, limit, sort: '-createdAt', populate: 'players.userId winner' });
  }

  async findByGame(gameType: string, page: number, limit: number): Promise<{ data: IMatchDocument[]; total: number; page: number; pages: number }> {
    return this.findMany({ gameType }, { page, limit, sort: '-createdAt' });
  }

  async abortPlayingSolo(userId: string, gameType: string): Promise<number> {
    const result = await this.model
      .updateMany(
        {
          gameType,
          status: 'playing',
          'settings.solo': true,
          'players.userId': userId,
        },
        { $set: { status: 'aborted', finishedAt: new Date() } }
      )
      .exec();
    return result.modifiedCount;
  }

  async findWaitingMatches(gameType: string): Promise<IMatchDocument[]> {
    const joinablePlaying = gameType === 'snake-multiplayer' || gameType === 'coil-rush';
    return this.model
      .find({
        gameType,
        status: joinablePlaying ? { $in: ['waiting', 'playing'] } : 'waiting',
        ...(joinablePlaying ? { $expr: { $lt: [{ $size: '$players' }, 50] } } : {}),
      })
      .populate('players.userId', 'username avatar elo')
      .sort({ createdAt: -1 })
      .exec();
  }

  async addMove(matchId: string, move: { player: string; action: string; data: Record<string, unknown> }): Promise<IMatchDocument | null> {
    return this.model
      .findByIdAndUpdate(matchId, { $push: { moves: { ...move, timestamp: new Date() } } }, { new: true })
      .exec();
  }

  async addSpectator(matchId: string, userId: string): Promise<void> {
    await this.model.findByIdAndUpdate(matchId, { $addToSet: { spectators: userId } });
  }

  async removeSpectator(matchId: string, userId: string): Promise<void> {
    await this.model.findByIdAndUpdate(matchId, { $pull: { spectators: userId } });
  }

  async getActiveMatches(): Promise<IMatchDocument[]> {
    return this.model
      .find({ status: { $in: ['waiting', 'playing'] } })
      .populate('players.userId', 'username avatar')
      .exec();
  }

  async getRecentMatches(limit: number = 10): Promise<IMatchDocument[]> {
    return this.model
      .find({ status: 'finished' })
      .sort({ finishedAt: -1 })
      .limit(limit)
      .populate('players.userId winner', 'username avatar')
      .exec();
  }

  async getDailyMatchCounts(days: number = 30): Promise<{ date: string; count: number }[]> {
    const { since } = getDateRange(days);

    const raw = await this.model.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return fillDailyCounts(
      raw.map((entry) => ({ _id: entry._id as string, count: entry.count as number })),
      days
    );
  }

  async getDailyActiveUsers(days: number = 30): Promise<{ date: string; count: number }[]> {
    const { since } = getDateRange(days);

    const raw = await this.model.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $unwind: '$players' },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            userId: '$players.userId',
          },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return fillDailyCounts(
      raw.map((entry) => ({ _id: entry._id as string, count: entry.count as number })),
      days
    );
  }

  async getGamesDistribution(): Promise<{ name: string; value: number }[]> {
    const raw = await this.model.aggregate([
      {
        $group: {
          _id: '$gameType',
          value: { $sum: 1 },
        },
      },
      { $sort: { value: -1 } },
    ]);

    return raw.map((entry) => ({
      name: entry._id as string,
      value: entry.value as number,
    }));
  }
}

export const matchRepository = new MatchRepository();
