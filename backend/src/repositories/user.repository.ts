import { BaseRepository } from './base.repository';
import { User } from '../models/user.model';
import { IUserDocument } from '../interfaces/user.interface';
import { fillDailyCounts, getDateRange } from '../utils/helpers';

class UserRepository extends BaseRepository<IUserDocument> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return this.model.findOne({ email }).select('+password +refreshToken').exec();
  }

  async findByUsername(username: string): Promise<IUserDocument | null> {
    return this.model.findOne({ username }).exec();
  }

  async findByVerificationToken(token: string): Promise<IUserDocument | null> {
    return this.model.findOne({ verificationToken: token }).select('+verificationToken').exec();
  }

  async findByResetToken(token: string): Promise<IUserDocument | null> {
    return this.model
      .findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() },
      })
      .select('+resetPasswordToken +resetPasswordExpire')
      .exec();
  }

  async findByRefreshToken(token: string): Promise<IUserDocument | null> {
    return this.model.findOne({ refreshToken: token }).select('+refreshToken').exec();
  }

  async searchUsers(query: string, page: number, limit: number): Promise<{ data: IUserDocument[]; total: number; page: number; pages: number }> {
    const filter = {
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    };
    return this.findMany(filter, { page, limit });
  }

  async getOnlineUsers(): Promise<IUserDocument[]> {
    return this.model.find({ isOnline: true }).select('username avatar elo level').exec();
  }

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await this.model.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: new Date(),
    });
  }

  async getTopPlayers(limit: number = 10): Promise<IUserDocument[]> {
    return this.model.find().sort({ elo: -1 }).limit(limit).select('username avatar elo level wins losses').exec();
  }

  async incrementStats(userId: string, field: 'wins' | 'losses' | 'draws' | 'gamesPlayed', amount = 1): Promise<void> {
    await this.model.findByIdAndUpdate(userId, {
      $inc: { [field]: amount },
    });
  }

  async addFriend(userId: string, friendId: string): Promise<void> {
    await this.model.findByIdAndUpdate(userId, {
      $addToSet: { friends: friendId },
    });
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await this.model.findByIdAndUpdate(userId, {
      $pull: { friends: friendId },
    });
  }

  async addAchievement(userId: string, achievementId: string): Promise<void> {
    await this.model.findByIdAndUpdate(userId, {
      $addToSet: { achievements: achievementId },
    });
  }

  async addXp(userId: string, xp: number): Promise<IUserDocument | null> {
    return this.model.findByIdAndUpdate(userId, { $inc: { xp } }, { new: true }).exec();
  }

  async getDailySignups(days: number = 30): Promise<{ date: string; count: number }[]> {
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
}

export const userRepository = new UserRepository();
