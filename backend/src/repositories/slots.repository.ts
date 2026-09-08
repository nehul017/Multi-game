import { BaseRepository } from './base.repository';
import { GameSession } from '../models/game-session.model';
import { Spin } from '../models/spin.model';
import { IGameSessionDocument, ISpinDocument } from '../interfaces/slots.interface';

class GameSessionRepository extends BaseRepository<IGameSessionDocument> {
  constructor() {
    super(GameSession);
  }

  async findActive(userId: string, gameId: string): Promise<IGameSessionDocument | null> {
    return this.model.findOne({ userId, gameId, status: 'active' }).exec();
  }

  async upsertActive(
    userId: string,
    gameId: string,
    patch: Partial<IGameSessionDocument> = {}
  ): Promise<IGameSessionDocument> {
    const existing = await this.findActive(userId, gameId);
    if (existing) {
      Object.assign(existing, patch, { status: 'active' });
      return existing.save();
    }

    return this.model.create({
      userId,
      gameId,
      status: 'active',
      lastBet: 0,
      lastWin: 0,
      lastReels: null,
      lastWinningLines: [],
      lastSpinId: null,
      lastRequestId: null,
      ...patch,
    });
  }
}

class SpinRepository extends BaseRepository<ISpinDocument> {
  constructor() {
    super(Spin);
  }

  async findByRequestId(userId: string, requestId: string): Promise<ISpinDocument | null> {
    return this.model.findOne({ userId, requestId }).exec();
  }

  async findRecentByUser(userId: string, gameId: string, limit = 20): Promise<ISpinDocument[]> {
    return this.model
      .find({ userId, gameId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}

export const gameSessionRepository = new GameSessionRepository();
export const spinRepository = new SpinRepository();
