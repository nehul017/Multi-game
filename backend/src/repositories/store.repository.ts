import { BaseRepository } from './base.repository';
import { StoreItem } from '../models/store-item.model';
import { CoinPack } from '../models/coin-pack.model';
import { IStoreItemDocument, ICoinPackDocument, StoreItemType } from '../interfaces/economy.interface';

class StoreItemRepository extends BaseRepository<IStoreItemDocument> {
  constructor() {
    super(StoreItem);
  }

  async findActive(type?: StoreItemType, page = 1, limit = 50) {
    const filter: Record<string, unknown> = { isActive: true };
    if (type) filter.type = type;
    return this.findMany(filter, { page, limit, sort: 'price' });
  }
}

class CoinPackRepository extends BaseRepository<ICoinPackDocument> {
  constructor() {
    super(CoinPack);
  }

  async findActive() {
    return this.model.find({ isActive: true }).sort({ sortOrder: 1, coins: 1 }).exec();
  }
}

export const storeItemRepository = new StoreItemRepository();
export const coinPackRepository = new CoinPackRepository();
