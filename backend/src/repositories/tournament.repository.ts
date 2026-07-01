import { BaseRepository } from './base.repository';
import { Tournament } from '../models/tournament.model';
import { ITournamentDocument } from '../interfaces/tournament.interface';

class TournamentRepository extends BaseRepository<ITournamentDocument> {
  constructor() {
    super(Tournament);
  }

  async findActive(): Promise<ITournamentDocument[]> {
    return this.model
      .find({ status: { $in: ['upcoming', 'registration', 'in_progress'] } })
      .populate('createdBy', 'username avatar')
      .sort({ startDate: 1 })
      .exec();
  }

  async findByCreator(userId: string, page: number, limit: number): Promise<{ data: ITournamentDocument[]; total: number; page: number; pages: number }> {
    return this.findMany({ createdBy: userId }, { page, limit, sort: '-createdAt' });
  }

  async addParticipant(tournamentId: string, userId: string): Promise<ITournamentDocument | null> {
    return this.model
      .findByIdAndUpdate(tournamentId, { $addToSet: { participants: userId } }, { new: true })
      .exec();
  }

  async removeParticipant(tournamentId: string, userId: string): Promise<ITournamentDocument | null> {
    return this.model
      .findByIdAndUpdate(tournamentId, { $pull: { participants: userId } }, { new: true })
      .exec();
  }

  async isParticipant(tournamentId: string, userId: string): Promise<boolean> {
    const tournament = await this.model.findOne({
      _id: tournamentId,
      participants: userId,
    });
    return !!tournament;
  }
}

export const tournamentRepository = new TournamentRepository();
