import { BaseRepository } from './base.repository';
import { PokerTable } from '../models/poker-table.model';
import { PokerHand } from '../models/poker-hand.model';
import { PokerAction } from '../models/poker-action.model';
import { PokerPlayerSession } from '../models/poker-player-session.model';
import type {
  IPokerActionDocument,
  IPokerHandDocument,
  IPokerPlayerSessionDocument,
  IPokerTableDocument,
} from '../interfaces/poker.interface';
import type { PokerGameType } from '../games/poker/core/game-state';

class PokerTableRepository extends BaseRepository<IPokerTableDocument> {
  constructor() {
    super(PokerTable);
  }

  async findByTableId(tableId: string) {
    return this.findOne({ tableId });
  }

  async listOpen(gameType?: PokerGameType) {
    const filter: Record<string, unknown> = {
      status: { $in: ['open', 'playing'] },
      fillBots: { $ne: true },
    };
    if (gameType) filter.gameType = gameType;
    return this.model.find(filter).sort({ updatedAt: -1 }).limit(50).exec();
  }

  async listPracticeOpen() {
    return this.model
      .find({
        status: { $in: ['open', 'playing'] },
        $or: [{ fillBots: true }, { tableId: /practice/i }],
      })
      .exec();
  }

  async upsertSnapshot(tableId: string, fields: Partial<IPokerTableDocument>) {
    return this.model.updateOne({ tableId }, { $set: fields }).exec();
  }
}

class PokerHandRepository extends BaseRepository<IPokerHandDocument> {
  constructor() {
    super(PokerHand);
  }

  async findByHandId(handId: string) {
    return this.findOne({ handId });
  }

  async findRecentByTable(tableId: string, limit = 20) {
    return this.model.find({ tableId, completedAt: { $exists: true } }).sort({ startedAt: -1 }).limit(limit).exec();
  }

  async findRecentByUser(userId: string, limit = 20) {
    return this.model
      .find({ 'players.userId': userId, completedAt: { $exists: true } })
      .sort({ startedAt: -1 })
      .limit(limit)
      .exec();
  }

  async completeHand(handId: string, fields: Record<string, unknown>) {
    return this.model.updateOne({ handId }, { $set: fields }).exec();
  }
}

class PokerActionRepository extends BaseRepository<IPokerActionDocument> {
  constructor() {
    super(PokerAction);
  }

  async findByHand(handId: string) {
    return this.model.find({ handId }).sort({ timestamp: 1 }).exec();
  }
}

class PokerPlayerSessionRepository extends BaseRepository<IPokerPlayerSessionDocument> {
  constructor() {
    super(PokerPlayerSession);
  }

  async findActive(tableId: string, userId: string) {
    return this.findOne({ tableId, userId, status: 'seated' });
  }

  async findActiveByUser(userId: string) {
    return this.findOne({ userId, status: 'seated' });
  }

  async markLeft(tableId: string, userId: string, chips: number) {
    return this.model
      .updateOne({ tableId, userId, status: 'seated' }, { $set: { status: 'left', chips, leftAt: new Date() } })
      .exec();
  }

  async findSeatedByTable(tableId: string) {
    return this.model.find({ tableId, status: 'seated' }).exec();
  }

  async markLeftByTable(tableId: string) {
    return this.model
      .updateMany({ tableId, status: 'seated' }, { $set: { status: 'left', leftAt: new Date() } })
      .exec();
  }
}

export const pokerTableRepository = new PokerTableRepository();
export const pokerHandRepository = new PokerHandRepository();
export const pokerActionRepository = new PokerActionRepository();
export const pokerPlayerSessionRepository = new PokerPlayerSessionRepository();
