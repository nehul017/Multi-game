import { BaseRepository } from './base.repository';
import { Session } from '../models/session.model';
import { ISessionDocument } from '../interfaces/session.interface';

class SessionRepository extends BaseRepository<ISessionDocument> {
  constructor() {
    super(Session);
  }

  async findBySocketId(socketId: string): Promise<ISessionDocument | null> {
    return this.model.findOne({ socketId }).exec();
  }

  async findActiveByUser(userId: string): Promise<ISessionDocument[]> {
    return this.model.find({ userId, isActive: true }).exec();
  }

  async deactivateBySocketId(socketId: string): Promise<void> {
    await this.model.findOneAndUpdate({ socketId }, { isActive: false });
  }

  async deactivateAllForUser(userId: string): Promise<void> {
    await this.model.updateMany({ userId }, { isActive: false });
  }

  async updateActivity(socketId: string): Promise<void> {
    await this.model.findOneAndUpdate({ socketId }, { lastActivity: new Date() });
  }

  async cleanupInactive(minutesOld: number = 30): Promise<number> {
    const cutoff = new Date(Date.now() - minutesOld * 60 * 1000);
    const result = await this.model.deleteMany({
      isActive: false,
      lastActivity: { $lt: cutoff },
    });
    return result.deletedCount || 0;
  }
}

export const sessionRepository = new SessionRepository();
