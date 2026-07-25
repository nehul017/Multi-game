import { BaseRepository } from './base.repository';
import { Transaction } from '../models/transaction.model';
import { ITransactionDocument } from '../interfaces/economy.interface';

class TransactionRepository extends BaseRepository<ITransactionDocument> {
  constructor() {
    super(Transaction);
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    return this.findMany({ userId }, { page, limit, sort: '-createdAt' });
  }

  async countPackPurchasesToday(userId: string): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.count({
      userId,
      type: 'pack_purchase',
      createdAt: { $gte: start },
    });
  }
}

export const transactionRepository = new TransactionRepository();
