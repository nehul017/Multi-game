import { userRepository } from '../repositories/user.repository';
import { transactionRepository } from '../repositories/transaction.repository';
import { coinPackRepository } from '../repositories/store.repository';
import { AppError } from '../utils/AppError';
import { COIN_REWARDS, ECONOMY } from '../utils/constants';
import { TransactionType } from '../interfaces/economy.interface';
import { notificationService } from './notification.service';
import { calculateLevel } from '../utils/helpers';

class EconomyService {
  async getWallet(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return {
      coins: user.coins ?? 0,
      loginStreak: user.loginStreak ?? 0,
      lastLoginRewardAt: user.lastLoginRewardAt,
      referralCode: user.referralCode,
      referralCount: user.referralCount ?? 0,
    };
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    return transactionRepository.findByUser(userId, page, limit);
  }

  async creditCoins(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    metadata: Record<string, unknown> = {}
  ): Promise<{ coins: number; transactionId: string }> {
    if (amount <= 0) throw new AppError('Credit amount must be positive', 400);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const nextBalance = (user.coins ?? 0) + amount;
    const updated = await userRepository.updateById(userId, { coins: nextBalance } as any);
    if (!updated) throw new AppError('Failed to update balance', 500);

    const tx = await transactionRepository.create({
      userId,
      type,
      amount,
      balanceAfter: nextBalance,
      description,
      metadata,
    } as any);

    return { coins: nextBalance, transactionId: tx._id.toString() };
  }

  async debitCoins(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    metadata: Record<string, unknown> = {}
  ): Promise<{ coins: number; transactionId: string }> {
    if (amount <= 0) throw new AppError('Debit amount must be positive', 400);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const current = user.coins ?? 0;
    if (current < amount) {
      throw new AppError('Insufficient coin balance', 400);
    }

    const nextBalance = current - amount;
    const updated = await userRepository.updateById(userId, { coins: nextBalance } as any);
    if (!updated) throw new AppError('Failed to update balance', 500);

    const tx = await transactionRepository.create({
      userId,
      type,
      amount: -amount,
      balanceAfter: nextBalance,
      description,
      metadata,
    } as any);

    return { coins: nextBalance, transactionId: tx._id.toString() };
  }

  async debitCoinsAtomic(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    metadata: Record<string, unknown> = {}
  ): Promise<{ coins: number; transactionId: string; balanceBefore: number }> {
    if (amount <= 0) throw new AppError('Debit amount must be positive', 400);

    const updated = await userRepository.debitCoinsIfSufficient(userId, amount);
    if (!updated) {
      const user = await userRepository.findById(userId);
      if (!user) throw new AppError('User not found', 404);
      throw new AppError('Insufficient coin balance', 400);
    }

    const coins = updated.coins ?? 0;
    const tx = await transactionRepository.create({
      userId,
      type,
      amount: -amount,
      balanceAfter: coins,
      description,
      metadata,
    } as any);

    return {
      coins,
      transactionId: tx._id.toString(),
      balanceBefore: coins + amount,
    };
  }

  async creditCoinsAtomic(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    metadata: Record<string, unknown> = {}
  ): Promise<{ coins: number; transactionId: string }> {
    if (amount <= 0) throw new AppError('Credit amount must be positive', 400);

    const updated = await userRepository.creditCoinsAtomic(userId, amount);
    if (!updated) throw new AppError('User not found', 404);

    const coins = updated.coins ?? 0;
    const tx = await transactionRepository.create({
      userId,
      type,
      amount,
      balanceAfter: coins,
      description,
      metadata,
    } as any);

    return { coins, transactionId: tx._id.toString() };
  }

  async grantWelcomeBonus(userId: string): Promise<void> {
    const existing = await transactionRepository.findOne({ userId, type: 'welcome' });
    if (existing) return;

    await this.creditCoins(
      userId,
      COIN_REWARDS.WELCOME,
      'welcome',
      'Welcome bonus coins',
      {}
    );
  }

  async claimDailyLogin(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const now = new Date();
    const last = user.lastLoginRewardAt ? new Date(user.lastLoginRewardAt) : null;

    if (last) {
      const lastDay = last.toISOString().slice(0, 10);
      const today = now.toISOString().slice(0, 10);
      if (lastDay === today) {
        throw new AppError('Daily login reward already claimed today', 400);
      }
    }

    let streak = 1;
    if (last) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().slice(0, 10);
      const lastKey = last.toISOString().slice(0, 10);
      streak = lastKey === yesterdayKey ? (user.loginStreak || 0) + 1 : 1;
    }

    const streakBonus = Math.min(
      (streak - 1) * COIN_REWARDS.DAILY_LOGIN_STREAK_BONUS,
      COIN_REWARDS.DAILY_LOGIN_MAX_STREAK_BONUS
    );
    const reward = COIN_REWARDS.DAILY_LOGIN_BASE + streakBonus;

    await userRepository.updateById(userId, {
      loginStreak: streak,
      lastLoginRewardAt: now,
    } as any);

    const result = await this.creditCoins(
      userId,
      reward,
      'daily_login',
      `Daily login reward (streak ${streak})`,
      { streak, base: COIN_REWARDS.DAILY_LOGIN_BASE, streakBonus }
    );

    await notificationService.create(
      userId,
      'system',
      'Daily Reward Claimed',
      `You earned ${reward} coins! Login streak: ${streak}`,
      { coins: reward, streak }
    );

    return {
      coins: result.coins,
      reward,
      streak,
      alreadyClaimed: false,
    };
  }

  async getDailyLoginStatus(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const last = user.lastLoginRewardAt ? new Date(user.lastLoginRewardAt) : null;
    const today = new Date().toISOString().slice(0, 10);
    const claimedToday = last ? last.toISOString().slice(0, 10) === today : false;

    const nextStreak = claimedToday
      ? user.loginStreak
      : last &&
          last.toISOString().slice(0, 10) ===
            new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        ? (user.loginStreak || 0) + 1
        : 1;

    const streakBonus = Math.min(
      ((nextStreak || 1) - 1) * COIN_REWARDS.DAILY_LOGIN_STREAK_BONUS,
      COIN_REWARDS.DAILY_LOGIN_MAX_STREAK_BONUS
    );

    return {
      claimedToday,
      loginStreak: user.loginStreak || 0,
      nextReward: COIN_REWARDS.DAILY_LOGIN_BASE + streakBonus,
      nextStreak,
    };
  }

  async purchaseCoinPack(userId: string, packId: string) {
    const pack = await coinPackRepository.findById(packId);
    if (!pack || !pack.isActive) throw new AppError('Coin pack not found', 404);

    const purchasesToday = await transactionRepository.countPackPurchasesToday(userId);
    if (purchasesToday >= ECONOMY.MAX_PACK_PURCHASES_PER_DAY) {
      throw new AppError('Daily coin pack purchase limit reached', 429);
    }

    const totalCoins = pack.coins + (pack.bonusCoins || 0);
    const result = await this.creditCoins(
      userId,
      totalCoins,
      'pack_purchase',
      `Purchased ${pack.name}`,
      {
        packId,
        coins: pack.coins,
        bonusCoins: pack.bonusCoins,
        priceLabel: pack.priceLabel,
      }
    );

    await notificationService.create(
      userId,
      'system',
      'Coins Added',
      `You received ${totalCoins} coins from ${pack.name}`,
      { coins: totalCoins, packId }
    );

    return {
      coins: result.coins,
      added: totalCoins,
      pack: {
        id: pack._id,
        name: pack.name,
        coins: pack.coins,
        bonusCoins: pack.bonusCoins,
      },
    };
  }

  async getCoinPacks() {
    return coinPackRepository.findActive();
  }

  async adminAdjustCoins(userId: string, amount: number, reason: string) {
    if (amount === 0) throw new AppError('Amount cannot be zero', 400);
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    if (amount > 0) {
      return this.creditCoins(userId, amount, 'admin_grant', reason || 'Admin grant');
    }

    const debit = Math.abs(amount);
    if ((user.coins ?? 0) < debit) {
      throw new AppError('Cannot deduct more coins than user balance', 400);
    }
    return this.debitCoins(userId, debit, 'admin_deduct', reason || 'Admin deduction');
  }

  async processReferralReward(referrerId: string, referredId: string) {
    await this.creditCoins(
      referrerId,
      COIN_REWARDS.REFERRAL_REFERRER,
      'referral',
      'Referral reward for inviting a friend',
      { referredId }
    );
    await this.creditCoins(
      referredId,
      COIN_REWARDS.REFERRAL_REFERRED,
      'referral',
      'Referral welcome bonus',
      { referrerId }
    );

    const referrer = await userRepository.findById(referrerId);
    if (referrer) {
      await userRepository.updateById(referrerId, {
        referralCount: (referrer.referralCount || 0) + 1,
      } as any);
    }
  }

  async rewardMatchResult(
    userId: string,
    result: 'win' | 'loss' | 'draw',
    matchId: string,
    gameType: string
  ) {
    const amount =
      result === 'win'
        ? COIN_REWARDS.WIN
        : result === 'draw'
          ? COIN_REWARDS.DRAW
          : COIN_REWARDS.LOSS;

    return this.creditCoins(
      userId,
      amount,
      result === 'win' ? 'match_win' : result === 'draw' ? 'match_draw' : 'match_loss',
      `${result === 'win' ? 'Won' : result === 'draw' ? 'Drew' : 'Completed'} ${gameType} match`,
      { matchId, gameType, result }
    );
  }

  async addXp(userId: string, xp: number) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const newXp = (user.xp || 0) + xp;
    const newLevel = calculateLevel(newXp);
    await userRepository.updateById(userId, { xp: newXp, level: newLevel } as any);
    return { xp: newXp, level: newLevel };
  }
}

export const economyService = new EconomyService();
