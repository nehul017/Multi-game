import { BaseRepository } from './base.repository';
import { Match } from '../models/match.model';
import { IMatchDocument } from '../interfaces/match.interface';

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

  async findWaitingMatches(gameType: string): Promise<IMatchDocument[]> {
    return this.model.find({ gameType, status: 'waiting' }).populate('players.userId', 'username avatar elo').exec();
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
}

export const matchRepository = new MatchRepository();
