import { randomUUID } from 'crypto';
import { AppError } from '../utils/AppError';
import { FRUIT_SLOTS_CONFIG, getPublicFruitSlotsConfig } from '../games/fruit-slots/config';
import { fruitSlotsEngine } from '../games/fruit-slots/engine';
import { FRUIT_SLOTS_GAME_ID, type ReelGrid, type WinningLine } from '../games/fruit-slots/types';
import { IGameSessionDocument, ISpinDocument } from '../interfaces/slots.interface';
import { gameSessionRepository, spinRepository } from '../repositories/slots.repository';
import { economyService } from './economy.service';
import { redisLockService, SLOT_REDIS_KEYS } from './redis-lock.service';

const SPIN_LOCK_TTL_MS = 10_000;
const IDEMPOTENCY_TTL_SEC = 120;
const SESSION_TTL_SEC = 60 * 60;
const RATE_WINDOW_SEC = 60;
const MAX_SPINS_PER_MINUTE = 30;
const HISTORY_LIMIT = 20;

export interface FruitSlotsState {
  gameId: typeof FRUIT_SLOTS_GAME_ID;
  sessionId: string;
  balance: number;
  currentBet: number;
  lastWin: number;
  lastReels: ReelGrid | null;
  lastWinningLines: WinningLine[];
  lastSpinId: string | null;
}

export interface FruitSlotsSpinResult {
  spinId: string;
  requestId: string;
  bet: number;
  reels: ReelGrid;
  winningLines: WinningLine[];
  winAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export interface FruitSlotsHistoryItem {
  spinId: string;
  bet: number;
  winAmount: number;
  reels: ReelGrid;
  winningLines: WinningLine[];
  balanceAfter: number;
  createdAt: string;
}

const toSpinResult = (spin: ISpinDocument): FruitSlotsSpinResult => ({
  spinId: spin._id.toString(),
  requestId: spin.requestId,
  bet: spin.bet,
  reels: spin.reels,
  winningLines: spin.winningLines,
  winAmount: spin.winAmount,
  balanceBefore: spin.balanceBefore,
  balanceAfter: spin.balanceAfter,
  createdAt: spin.createdAt.toISOString(),
});

const toHistoryItem = (spin: ISpinDocument): FruitSlotsHistoryItem => ({
  spinId: spin._id.toString(),
  bet: spin.bet,
  winAmount: spin.winAmount,
  reels: spin.reels,
  winningLines: spin.winningLines,
  balanceAfter: spin.balanceAfter,
  createdAt: spin.createdAt.toISOString(),
});

const toState = (session: IGameSessionDocument, balance: number): FruitSlotsState => ({
  gameId: FRUIT_SLOTS_GAME_ID,
  sessionId: session._id.toString(),
  balance,
  currentBet: session.lastBet || FRUIT_SLOTS_CONFIG.minBet,
  lastWin: session.lastWin || 0,
  lastReels: session.lastReels,
  lastWinningLines: session.lastWinningLines || [],
  lastSpinId: session.lastSpinId,
});

const assertGameId = (gameId: string): void => {
  if (gameId !== FRUIT_SLOTS_GAME_ID) {
    throw new AppError('Unknown game', 404);
  }
};

const assertRequestId = (requestId: string): void => {
  if (!requestId || typeof requestId !== 'string' || requestId.length < 8 || requestId.length > 80) {
    throw new AppError('A valid spin requestId is required', 400);
  }
  if (!/^[A-Za-z0-9_-]+$/.test(requestId)) {
    throw new AppError('Invalid spin requestId', 400);
  }
};

class FruitSlotsService {
  getPublicConfig() {
    return getPublicFruitSlotsConfig();
  }

  getCatalogInfo() {
    const config = this.getPublicConfig();
    return {
      id: config.gameId,
      slug: config.gameId,
      name: config.name,
      description:
        'A classic 5-reel fruit slot machine. Spin cherries, bells, and lucky sevens for line wins.',
      minPlayers: 1,
      maxPlayers: 1,
      category: 'arcade',
      thumbnail: '/images/games/classic-fruit-slots.svg',
    };
  }

  async join(userId: string, gameId: string): Promise<{
    state: FruitSlotsState;
    history: FruitSlotsHistoryItem[];
    config: ReturnType<typeof getPublicFruitSlotsConfig>;
  }> {
    assertGameId(gameId);

    const session = await gameSessionRepository.upsertActive(userId, gameId);
    const wallet = await economyService.getWallet(userId);
    const historyDocs = await spinRepository.findRecentByUser(userId, gameId, HISTORY_LIMIT);
    const state = toState(session, wallet.coins);

    await redisLockService.setJson(SLOT_REDIS_KEYS.session(userId, gameId), {
      sessionId: state.sessionId,
      status: 'active',
    }, SESSION_TTL_SEC);
    await redisLockService.setJson(SLOT_REDIS_KEYS.state(userId, gameId), state, SESSION_TTL_SEC);

    return {
      state,
      history: historyDocs.map(toHistoryItem),
      config: this.getPublicConfig(),
    };
  }

  async leave(userId: string, gameId: string): Promise<void> {
    assertGameId(gameId);
    const session = await gameSessionRepository.findActive(userId, gameId);
    if (session) {
      session.status = 'left';
      await session.save();
    }
    await redisLockService.setJson(
      SLOT_REDIS_KEYS.session(userId, gameId),
      { sessionId: session?._id.toString() || null, status: 'left' },
      60
    );
  }

  async getState(userId: string, gameId: string): Promise<FruitSlotsState> {
    assertGameId(gameId);
    const cached = await redisLockService.getJson<FruitSlotsState>(SLOT_REDIS_KEYS.state(userId, gameId));
    if (cached) return cached;

    const session = await gameSessionRepository.findActive(userId, gameId);
    if (!session) {
      throw new AppError('No active game session. Join the game first.', 400);
    }
    const wallet = await economyService.getWallet(userId);
    const state = toState(session, wallet.coins);
    await redisLockService.setJson(SLOT_REDIS_KEYS.state(userId, gameId), state, SESSION_TTL_SEC);
    return state;
  }

  async getHistory(userId: string, gameId: string, limit = HISTORY_LIMIT): Promise<FruitSlotsHistoryItem[]> {
    assertGameId(gameId);
    const docs = await spinRepository.findRecentByUser(userId, gameId, Math.min(limit, 50));
    return docs.map(toHistoryItem);
  }

  async spin(userId: string, gameId: string, bet: number, requestId: string): Promise<FruitSlotsSpinResult> {
    assertGameId(gameId);
    assertRequestId(requestId);
    fruitSlotsEngine.assertValidBet(bet);

    const rateCount = await redisLockService.incrementWithTtl(SLOT_REDIS_KEYS.rate(userId), RATE_WINDOW_SEC);
    if (rateCount > MAX_SPINS_PER_MINUTE) {
      throw new AppError('Too many spins. Please slow down.', 429);
    }

    const idemKey = SLOT_REDIS_KEYS.idempotency(userId, requestId);
    const cached = await redisLockService.getJson<FruitSlotsSpinResult>(idemKey);
    if (cached) return cached;

    const existing = await spinRepository.findByRequestId(userId, requestId);
    if (existing) {
      const result = toSpinResult(existing);
      await redisLockService.setJson(idemKey, result, IDEMPOTENCY_TTL_SEC);
      return result;
    }

    const lockToken = randomUUID();
    const lockKey = SLOT_REDIS_KEYS.lock(userId);
    const acquired = await redisLockService.acquireLock(lockKey, SPIN_LOCK_TTL_MS, lockToken);
    if (!acquired) {
      throw new AppError('Spin already in progress', 409);
    }

    let debited = false;
    let debitAmount = 0;

    try {
      const cachedAfterLock = await redisLockService.getJson<FruitSlotsSpinResult>(idemKey);
      if (cachedAfterLock) return cachedAfterLock;

      const existingAfterLock = await spinRepository.findByRequestId(userId, requestId);
      if (existingAfterLock) {
        const result = toSpinResult(existingAfterLock);
        await redisLockService.setJson(idemKey, result, IDEMPOTENCY_TTL_SEC);
        return result;
      }

      const session = await gameSessionRepository.findActive(userId, gameId);
      if (!session) {
        throw new AppError('No active game session. Join the game first.', 400);
      }

      const debit = await economyService.debitCoinsAtomic(
        userId,
        bet,
        'slot_bet',
        'Classic Fruit Slots bet',
        { gameId, requestId }
      );
      debited = true;
      debitAmount = bet;

      const outcome = fruitSlotsEngine.resolveSpin(bet);
      let balanceAfter = debit.coins;

      if (outcome.winAmount > 0) {
        const credit = await economyService.creditCoinsAtomic(
          userId,
          outcome.winAmount,
          'slot_win',
          'Classic Fruit Slots win',
          { gameId, requestId, winAmount: outcome.winAmount }
        );
        balanceAfter = credit.coins;
      }

      const spin = await spinRepository.create({
        userId,
        gameId,
        sessionId: session._id,
        requestId,
        bet,
        reels: outcome.reels,
        winningLines: outcome.winningLines,
        winAmount: outcome.winAmount,
        balanceBefore: debit.balanceBefore,
        balanceAfter,
      });

      session.lastBet = bet;
      session.lastWin = outcome.winAmount;
      session.lastReels = outcome.reels;
      session.lastWinningLines = outcome.winningLines;
      session.lastSpinId = spin._id.toString();
      session.lastRequestId = requestId;
      await session.save();

      const result = toSpinResult(spin);
      const state = toState(session, balanceAfter);

      await redisLockService.setJson(idemKey, result, IDEMPOTENCY_TTL_SEC);
      await redisLockService.setJson(SLOT_REDIS_KEYS.state(userId, gameId), state, SESSION_TTL_SEC);
      await redisLockService.setJson(
        SLOT_REDIS_KEYS.session(userId, gameId),
        { sessionId: state.sessionId, status: 'active', lastSpinId: result.spinId },
        SESSION_TTL_SEC
      );

      return result;
    } catch (error) {
      if (debited && debitAmount > 0 && !(error instanceof AppError && error.statusCode === 400)) {
        try {
          await economyService.creditCoinsAtomic(
            userId,
            debitAmount,
            'refund',
            'Classic Fruit Slots bet refund',
            { gameId, requestId }
          );
        } catch (refundError) {
          console.error('[fruit-slots] failed to refund bet after spin error', refundError);
        }
      }
      throw error;
    } finally {
      await redisLockService.releaseLock(lockKey, lockToken);
    }
  }
}

export const fruitSlotsService = new FruitSlotsService();
