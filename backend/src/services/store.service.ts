import { storeItemRepository, coinPackRepository } from '../repositories/store.repository';
import { userRepository } from '../repositories/user.repository';
import { economyService } from './economy.service';
import { AppError } from '../utils/AppError';
import { StoreItemType } from '../interfaces/economy.interface';
import { notificationService } from './notification.service';
import { missionService } from './mission.service';

class StoreService {
  async getCatalog(type?: StoreItemType, page = 1, limit = 50) {
    return storeItemRepository.findActive(type, page, limit);
  }

  async getItem(itemId: string) {
    const item = await storeItemRepository.findById(itemId);
    if (!item || !item.isActive) throw new AppError('Store item not found', 404);
    return item;
  }

  async purchaseItem(userId: string, itemId: string) {
    const item = await storeItemRepository.findById(itemId);
    if (!item || !item.isActive) throw new AppError('Store item not found', 404);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const alreadyOwned = user.inventory?.some((entry) => entry.itemId?.toString() === itemId);
    if (alreadyOwned) throw new AppError('Item already owned', 400);

    if (item.stock === 0) throw new AppError('Item out of stock', 400);

    await economyService.debitCoins(
      userId,
      item.price,
      'store_purchase',
      `Purchased ${item.name}`,
      { itemId, itemType: item.type }
    );

    if (item.stock > 0) {
      await storeItemRepository.updateById(itemId, { stock: item.stock - 1 } as any);
    }

    const inventory = [
      ...this.toPlainInventory(user.inventory),
      { itemId, purchasedAt: new Date(), equipped: false },
    ];
    await userRepository.updateById(userId, { inventory } as any);

    await missionService.trackProgress(userId, 'spend_coins', item.price);

    await notificationService.create(
      userId,
      'system',
      'Purchase Complete',
      `You bought ${item.name} for ${item.price} coins`,
      { itemId, price: item.price }
    );

    const wallet = await economyService.getWallet(userId);
    return {
      item,
      coins: wallet.coins,
      inventory,
    };
  }

  async getInventory(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const inventory = this.toPlainInventory(user.inventory);
    const items = await Promise.all(inventory.map((entry) => storeItemRepository.findById(entry.itemId)));

    return {
      inventory: inventory.map((entry, index) => ({
        ...entry,
        item: items[index],
      })),
      equipped: this.toPlainEquipped(user.equipped),
    };
  }

  private toPlainInventory(entries: Array<{ itemId?: unknown; purchasedAt?: Date; equipped?: boolean }> = []) {
    return entries
      .map((entry) => {
        const id = entry.itemId?.toString();
        if (!id) return null;
        return {
          itemId: id,
          purchasedAt: entry.purchasedAt ?? new Date(),
          equipped: !!entry.equipped,
        };
      })
      .filter((entry): entry is { itemId: string; purchasedAt: Date; equipped: boolean } => entry !== null);
  }

  private toPlainEquipped(equipped?: {
    avatar?: unknown;
    theme?: unknown;
    frame?: unknown;
    badge?: unknown;
  }) {
    const plain: Record<string, string> = {};
    if (!equipped) return plain;
    for (const slot of ['avatar', 'theme', 'frame', 'badge'] as const) {
      const id = equipped[slot]?.toString();
      if (id) plain[slot] = id;
    }
    return plain;
  }

  async equipItem(userId: string, itemId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const owned = user.inventory?.find((entry) => entry.itemId?.toString() === itemId);
    if (!owned) throw new AppError('Item not in inventory', 400);

    const item = await storeItemRepository.findById(itemId);
    if (!item) throw new AppError('Store item not found', 404);

    const equipSlot = item.type as 'avatar' | 'theme' | 'frame' | 'badge';
    if (!['avatar', 'theme', 'frame', 'badge'].includes(equipSlot)) {
      throw new AppError('This item cannot be equipped', 400);
    }

    // Plain objects only — spreading Mongoose subdocs drops getter fields like itemId
    const inventory = this.toPlainInventory(user.inventory);

    for (let i = 0; i < inventory.length; i++) {
      if (inventory[i].itemId === itemId) {
        inventory[i] = { ...inventory[i], equipped: true };
        continue;
      }
      if (!inventory[i].equipped) continue;

      const invItem = await storeItemRepository.findById(inventory[i].itemId);
      if (invItem && invItem.type === item.type) {
        inventory[i] = { ...inventory[i], equipped: false };
      }
    }

    const equipped = { ...this.toPlainEquipped(user.equipped), [equipSlot]: itemId };
    const updates: Record<string, unknown> = { inventory, equipped };

    if (item.type === 'avatar' && item.image) {
      updates.avatar = item.image;
    }

    await userRepository.updateById(userId, updates as any);
    return { equipped, inventory };
  }

  async unequipItem(userId: string, itemId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const item = await storeItemRepository.findById(itemId);
    if (!item) throw new AppError('Store item not found', 404);

    const inventory = this.toPlainInventory(user.inventory).map((entry) =>
      entry.itemId === itemId ? { ...entry, equipped: false } : entry
    );

    const equipped = this.toPlainEquipped(user.equipped);
    if (equipped[item.type] === itemId) {
      delete equipped[item.type];
    }

    await userRepository.updateById(userId, { inventory, equipped } as any);
    return { equipped, inventory };
  }

  // Admin CRUD
  async createItem(data: Record<string, unknown>) {
    return storeItemRepository.create(data as any);
  }

  async updateItem(id: string, data: Record<string, unknown>) {
    const item = await storeItemRepository.updateById(id, data as any);
    if (!item) throw new AppError('Store item not found', 404);
    return item;
  }

  async deleteItem(id: string) {
    const item = await storeItemRepository.deleteById(id);
    if (!item) throw new AppError('Store item not found', 404);
    return item;
  }

  async createPack(data: Record<string, unknown>) {
    return coinPackRepository.create(data as any);
  }

  async updatePack(id: string, data: Record<string, unknown>) {
    const pack = await coinPackRepository.updateById(id, data as any);
    if (!pack) throw new AppError('Coin pack not found', 404);
    return pack;
  }

  async deletePack(id: string) {
    const pack = await coinPackRepository.deleteById(id);
    if (!pack) throw new AppError('Coin pack not found', 404);
    return pack;
  }

  async getAllItemsAdmin(page = 1, limit = 50) {
    return storeItemRepository.findMany({}, { page, limit, sort: '-createdAt' });
  }

  async getAllPacksAdmin() {
    return coinPackRepository.findMany({}, { page: 1, limit: 100, sort: 'sortOrder' });
  }
}

export const storeService = new StoreService();
