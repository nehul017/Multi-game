import { AppError } from '../../utils/AppError';
import { FRUIT_SLOTS_CONFIG } from '../../games/fruit-slots/config';
import {
  calculatePayout,
  evaluatePaylines,
  generateReels,
  isValidBetAmount,
  resolveSpin,
  selectWeightedSymbol,
} from '../../games/fruit-slots/engine';
import { redisLockService, SLOT_REDIS_KEYS } from '../../services/redis-lock.service';
import type { ReelGrid, SymbolId } from '../../games/fruit-slots/types';

jest.mock('../../services/economy.service', () => ({
  economyService: {
    getWallet: jest.fn(),
    debitCoinsAtomic: jest.fn(),
    creditCoinsAtomic: jest.fn(),
  },
}));

jest.mock('../../repositories/slots.repository', () => ({
  gameSessionRepository: {
    upsertActive: jest.fn(),
    findActive: jest.fn(),
  },
  spinRepository: {
    findByRequestId: jest.fn(),
    findRecentByUser: jest.fn(),
    create: jest.fn(),
  },
}));

import { economyService } from '../../services/economy.service';
import { gameSessionRepository, spinRepository } from '../../repositories/slots.repository';
import { fruitSlotsService } from '../../services/fruit-slots.service';

const grid = (rows: SymbolId[][]): ReelGrid => rows;

const all = (symbol: SymbolId): ReelGrid => [
  [symbol, symbol, symbol, symbol, symbol],
  [symbol, symbol, symbol, symbol, symbol],
  [symbol, symbol, symbol, symbol, symbol],
];

const mixedNoWin: ReelGrid = [
  ['cherry', 'lemon', 'orange', 'grapes', 'watermelon'],
  ['bell', 'seven', 'cherry', 'lemon', 'orange'],
  ['grapes', 'watermelon', 'bell', 'seven', 'cherry'],
];

describe('Fruit Slots engine', () => {
  it('selects symbols using configured weights', () => {
    const sequence = [0, 0.5, 0.99];
    let i = 0;
    const picks = sequence.map(() => selectWeightedSymbol(() => sequence[i++] ?? 0));
    expect(picks).toHaveLength(3);
    picks.forEach((id) => {
      expect(FRUIT_SLOTS_CONFIG.symbols.some((symbol) => symbol.id === id)).toBe(true);
    });
  });

  it('always picks the first symbol when random is 0', () => {
    expect(selectWeightedSymbol(() => 0)).toBe(FRUIT_SLOTS_CONFIG.symbols[0].id);
  });

  it('generates a 3x5 reel window', () => {
    const reels = generateReels(() => 0.1);
    expect(reels).toHaveLength(3);
    expect(reels.every((row) => row.length === 5)).toBe(true);
  });

  it('detects a middle-line 3-of-a-kind and pays the configured multiplier', () => {
    const reels = grid([
      ['lemon', 'orange', 'grapes', 'bell', 'seven'],
      ['cherry', 'cherry', 'cherry', 'lemon', 'orange'],
      ['orange', 'grapes', 'bell', 'seven', 'lemon'],
    ]);
    const lines = evaluatePaylines(reels, 10);
    const middle = lines.find((line) => line.paylineId === 'middle');
    expect(middle).toMatchObject({ symbolId: 'cherry', count: 3, multiplier: 2, payout: 20 });
  });

  it('pays more for four and five matching symbols', () => {
    const four = evaluatePaylines(
      grid([
        ['lemon', 'orange', 'grapes', 'bell', 'seven'],
        ['seven', 'seven', 'seven', 'seven', 'cherry'],
        ['orange', 'grapes', 'bell', 'lemon', 'watermelon'],
      ]),
      10
    ).find((line) => line.paylineId === 'middle');
    const five = evaluatePaylines(
      grid([
        ['lemon', 'orange', 'grapes', 'bell', 'watermelon'],
        ['seven', 'seven', 'seven', 'seven', 'seven'],
        ['orange', 'grapes', 'bell', 'lemon', 'cherry'],
      ]),
      10
    ).find((line) => line.paylineId === 'middle');

    expect(four?.payout).toBe(10 * 100);
    expect(five?.payout).toBe(10 * 500);
    expect((five?.payout || 0) > (four?.payout || 0)).toBe(true);
  });

  it('returns a zero-win result when no payline matches', () => {
    const outcome = resolveSpin(10, { reels: mixedNoWin });
    expect(outcome.winningLines).toEqual([]);
    expect(outcome.winAmount).toBe(0);
    expect(calculatePayout(outcome.winningLines)).toBe(0);
  });

  it('calculates the maximum win when every cell is Lucky 7', () => {
    const outcome = resolveSpin(10, { reels: all('seven') });
    expect(outcome.winningLines).toHaveLength(FRUIT_SLOTS_CONFIG.paylines.length);
    expect(outcome.winningLines.every((line) => line.count === 5 && line.symbolId === 'seven')).toBe(true);
    expect(outcome.winAmount).toBe(10 * 500 * FRUIT_SLOTS_CONFIG.paylines.length);
  });

  it('rejects invalid bets', () => {
    expect(isValidBetAmount(9)).toBe(false);
    expect(isValidBetAmount(501)).toBe(false);
    expect(isValidBetAmount(12)).toBe(false);
    expect(() => resolveSpin(7, { reels: mixedNoWin })).toThrow(AppError);
  });
});

describe('Redis lock / idempotency', () => {
  beforeEach(() => {
    redisLockService.clearMemory();
  });

  it('prevents a second lock holder while the first lock is alive', async () => {
    const key = SLOT_REDIS_KEYS.lock('user-1');
    await expect(redisLockService.acquireLock(key, 5000, 'a')).resolves.toBe(true);
    await expect(redisLockService.acquireLock(key, 5000, 'b')).resolves.toBe(false);
    await redisLockService.releaseLock(key, 'a');
    await expect(redisLockService.acquireLock(key, 5000, 'b')).resolves.toBe(true);
  });

  it('stores and returns idempotent spin payloads', async () => {
    const key = SLOT_REDIS_KEYS.idempotency('user-1', 'req-1');
    await redisLockService.setJson(key, { spinId: 's1', winAmount: 40 }, 60);
    await expect(redisLockService.getJson<{ spinId: string }>(key)).resolves.toEqual({
      spinId: 's1',
      winAmount: 40,
    });
  });
});

describe('Fruit Slots service', () => {
  const userId = '507f1f77bcf86cd799439011';
  const gameId = 'classic-fruit-slots';

  const session = {
    _id: { toString: () => 'session-1' },
    userId,
    gameId,
    status: 'active',
    lastBet: 10,
    lastWin: 0,
    lastReels: null,
    lastWinningLines: [],
    lastSpinId: null,
    lastRequestId: null,
    save: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    redisLockService.clearMemory();
    (economyService.getWallet as jest.Mock).mockResolvedValue({ coins: 1000 });
    (gameSessionRepository.findActive as jest.Mock).mockResolvedValue(session);
    (gameSessionRepository.upsertActive as jest.Mock).mockResolvedValue(session);
    (spinRepository.findByRequestId as jest.Mock).mockResolvedValue(null);
    (spinRepository.findRecentByUser as jest.Mock).mockResolvedValue([]);
    (spinRepository.create as jest.Mock).mockImplementation(async (data: Record<string, unknown>) => ({
      ...data,
      _id: { toString: () => 'spin-1' },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }));
    session.save.mockClear();
  });

  it('rejects an invalid bet before touching the wallet', async () => {
    await expect(fruitSlotsService.spin(userId, gameId, 7, 'request-invalid-bet')).rejects.toThrow(
      /Bet must be between/
    );
    expect(economyService.debitCoinsAtomic).not.toHaveBeenCalled();
  });

  it('rejects an insufficient balance from the economy layer', async () => {
    (economyService.debitCoinsAtomic as jest.Mock).mockRejectedValue(
      new AppError('Insufficient coin balance', 400)
    );

    await expect(fruitSlotsService.spin(userId, gameId, 10, 'request-broke')).rejects.toThrow(
      'Insufficient coin balance'
    );
    expect(economyService.creditCoinsAtomic).not.toHaveBeenCalled();
  });

  it('returns the cached result for a duplicate spin requestId', async () => {
    (economyService.debitCoinsAtomic as jest.Mock).mockResolvedValue({
      coins: 990,
      transactionId: 'tx-1',
      balanceBefore: 1000,
    });
    (economyService.creditCoinsAtomic as jest.Mock).mockImplementation(
      async (_id: string, amount: number) => ({ coins: 990 + amount, transactionId: 'tx-2' })
    );

    const first = await fruitSlotsService.spin(userId, gameId, 10, 'request-duplicate');
    const debitCalls = (economyService.debitCoinsAtomic as jest.Mock).mock.calls.length;
    const second = await fruitSlotsService.spin(userId, gameId, 10, 'request-duplicate');

    expect(second.spinId).toBe(first.spinId);
    expect(second.requestId).toBe(first.requestId);
    expect(economyService.debitCoinsAtomic).toHaveBeenCalledTimes(debitCalls);
  });

  it('rejects a concurrent second spin while the first lock is held', async () => {
    let releaseDebit: ((value: { coins: number; transactionId: string; balanceBefore: number }) => void) | undefined;
    (economyService.debitCoinsAtomic as jest.Mock).mockImplementation(
      () =>
        new Promise<{ coins: number; transactionId: string; balanceBefore: number }>((resolve) => {
          releaseDebit = resolve;
        })
    );
    (economyService.creditCoinsAtomic as jest.Mock).mockResolvedValue({
      coins: 990,
      transactionId: 'tx-2',
    });

    const first = fruitSlotsService.spin(userId, gameId, 10, 'request-one');
    await new Promise((resolve) => setImmediate(resolve));
    await expect(fruitSlotsService.spin(userId, gameId, 10, 'request-two')).rejects.toMatchObject({
      message: 'Spin already in progress',
      statusCode: 409,
    });

    if (!releaseDebit) {
      throw new Error('First spin did not reach the debit lock');
    }
    releaseDebit({ coins: 990, transactionId: 'tx-1', balanceBefore: 1000 });
    await first;
  });

  it('joins a session and returns balance plus public config', async () => {
    const joined = await fruitSlotsService.join(userId, gameId);
    expect(joined.state.balance).toBe(1000);
    expect(joined.config.gameId).toBe(gameId);
    expect(joined.config.symbols[0]).not.toHaveProperty('weight');
  });
});
