import { randomUUID } from 'crypto';
import { AppError } from '../utils/AppError';
import {
  BOT_ACTION_DELAY_MS,
  CASH_LOBBY_TABLES,
  defaultTableConfig,
  HAND_PAUSE_MS,
  POKER_GAME_ID,
  POKER_VARIANTS,
} from '../games/poker/config';
import type {
  PokerActionInput,
  PokerGameType,
  PublicTableState,
  TableConfig,
  TableState,
} from '../games/poker/core/game-state';
import {
  applyAction,
  applyTimeout,
  canStartHand,
  chooseBotAction,
  createTableState,
  prepareNextHand,
  removePlayer,
  sanitizeTableState,
  sitPlayer,
  startHand,
} from '../games/poker/core/table';
import { economyService } from './economy.service';
import { redisLockService, POKER_REDIS_KEYS } from './redis-lock.service';
import {
  pokerActionRepository,
  pokerHandRepository,
  pokerPlayerSessionRepository,
  pokerTableRepository,
} from '../repositories/poker.repository';

const TABLE_TTL_SEC = 60 * 60 * 6;
const LOCK_TTL_MS = 8_000;
const BOT_NAMES = ['Dealer Dan', 'Felt Fiona', 'River Rex', 'Ace Amelia', 'Chip Cole', 'Bluff Bea'];

export type PokerRuntimeEvent =
  | { type: 'state' }
  | { type: 'player-joined'; userId: string }
  | { type: 'player-left'; userId: string }
  | { type: 'hand-start' }
  | { type: 'cards-dealt' }
  | { type: 'community' }
  | { type: 'action-accepted'; userId: string; action: PokerActionInput }
  | { type: 'turn' }
  | { type: 'draw-complete' }
  | { type: 'showdown' }
  | { type: 'hand-result' }
  | { type: 'pot-update' }
  | { type: 'balance-update'; userId: string; balance: number }
  | { type: 'timer' };

type TableListener = (tableId: string, state: TableState, event: PokerRuntimeEvent) => void;

const memoryTables = new Map<string, TableState>();
const timers = new Map<string, NodeJS.Timeout>();
const listeners = new Set<TableListener>();

const isBotId = (userId: string): boolean => userId.startsWith('bot:');

const withLock = async <T>(tableId: string, fn: () => Promise<T>): Promise<T> => {
  const token = randomUUID();
  const key = POKER_REDIS_KEYS.lock(tableId);
  const acquired = await redisLockService.acquireLock(key, LOCK_TTL_MS, token);
  if (!acquired) {
    throw new AppError('Table is busy, try again', 409);
  }
  try {
    return await fn();
  } finally {
    await redisLockService.releaseLock(key, token);
  }
};

const persistState = async (state: TableState): Promise<void> => {
  memoryTables.set(state.tableId, state);
  await redisLockService.setJson(POKER_REDIS_KEYS.state(state.tableId), state, TABLE_TTL_SEC);
  await pokerTableRepository.upsertSnapshot(state.tableId, {
    name: state.config.name,
    gameType: state.config.gameType,
    maxSeats: state.config.maxSeats,
    smallBlind: state.config.smallBlind,
    bigBlind: state.config.bigBlind,
    buyInMin: state.config.buyInMin,
    buyInMax: state.config.buyInMax,
    actionTimeoutMs: state.config.actionTimeoutMs,
    fillBots: state.config.fillBots,
    status: state.status,
    seatedCount: state.players.filter((player) => !player.isBot).length,
  });
};

const loadState = async (tableId: string): Promise<TableState | null> => {
  const cached = memoryTables.get(tableId);
  if (cached) return cached;
  const fromRedis = await redisLockService.getJson<TableState>(POKER_REDIS_KEYS.state(tableId));
  if (fromRedis) {
    memoryTables.set(tableId, fromRedis);
    return fromRedis;
  }
  return null;
};

const requireState = async (tableId: string): Promise<TableState> => {
  const state = await loadState(tableId);
  if (!state) throw new AppError('Table not found', 404);
  return state;
};

const emit = (state: TableState, event: PokerRuntimeEvent): void => {
  listeners.forEach((listener) => listener(state.tableId, state, event));
};

const scheduleTable = (state: TableState): void => {
  const existing = timers.get(state.tableId);
  if (existing) clearTimeout(existing);

  const current = state.players.find((player) => player.userId === state.currentPlayerId);
  if (current && state.actionDeadline) {
    const delay = current.isBot
      ? BOT_ACTION_DELAY_MS
      : Math.max(250, state.actionDeadline - Date.now());
    timers.set(
      state.tableId,
      setTimeout(() => {
        void pokerService.onTimer(state.tableId);
      }, delay)
    );
    return;
  }

  const hasHuman = state.players.some((player) => !player.isBot && player.chips > 0);
  if (state.street === 'complete' && canStartHand(state) && hasHuman) {
    timers.set(
      state.tableId,
      setTimeout(() => {
        void pokerService.beginNextHand(state.tableId);
      }, HAND_PAUSE_MS)
    );
  }
};

const persistHandStart = async (state: TableState): Promise<void> => {
  if (!state.handId) return;
  await pokerHandRepository.create({
    handId: state.handId,
    tableId: state.tableId,
    gameType: state.config.gameType,
    players: state.players.map((player) => ({
      userId: player.userId,
      username: player.username,
      seatIndex: player.seatIndex,
      startingChips: player.chips + player.committed,
    })),
    dealerPosition: state.dealerPosition,
    blinds: { small: state.config.smallBlind, big: state.config.bigBlind },
    communityCards: [],
    startedAt: new Date(state.handStartedAt || Date.now()),
  } as never);
};

const persistHandEnd = async (state: TableState): Promise<void> => {
  if (!state.handId) return;
  await pokerHandRepository.completeHand(state.handId, {
    communityCards: state.communityCards.map((card) => card.id),
    result: state.showdown,
    pots: state.showdown?.pots || [],
    completedAt: new Date(),
    players: state.players.map((player) => ({
      userId: player.userId,
      username: player.username,
      seatIndex: player.seatIndex,
      startingChips: player.chips + player.committed,
      endingChips: player.chips,
    })),
  });
};

const persistAction = async (state: TableState, userId: string, action: PokerActionInput): Promise<void> => {
  if (!state.handId) return;
  await pokerActionRepository.create({
    handId: state.handId,
    tableId: state.tableId,
    userId,
    action: action.type,
    amount: action.amount,
    street: state.street,
    timestamp: new Date(),
  } as never);
};

const fillBotsIfNeeded = (state: TableState): void => {
  if (!state.config.fillBots) return;
  let botIndex = 0;
  while (state.players.length < Math.min(state.config.maxSeats, 3)) {
    const name = BOT_NAMES[botIndex % BOT_NAMES.length];
    sitPlayer(state, {
      userId: `bot:${state.tableId}:${botIndex}`,
      username: name,
      chips: Math.max(state.config.buyInMin, state.config.bigBlind * 40),
      isBot: true,
    });
    botIndex += 1;
  }
};

const afterMutation = async (
  state: TableState,
  events: PokerRuntimeEvent[]
): Promise<TableState> => {
  await persistState(state);
  events.forEach((event) => emit(state, event));
  scheduleTable(state);
  return state;
};

class PokerService {
  onTableEvent(listener: TableListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  getPublicConfig() {
    return {
      gameId: POKER_GAME_ID,
      name: 'Poker Room',
      variants: POKER_VARIANTS,
      seats: [2, 3, 4, 5, 6, 8, 9],
      defaultTimeoutMs: 15_000,
    };
  }

  getCatalogInfo() {
    return {
      id: POKER_GAME_ID,
      slug: POKER_GAME_ID,
      name: 'Poker Room',
      description: 'Texas Hold’em, Omaha, Omaha Hi-Lo, and 5 Card Draw on a shared casino table.',
      minPlayers: 2,
      maxPlayers: 9,
      category: 'arcade',
      thumbnail: '/images/games/poker.svg',
    };
  }

  async ensureLobbyTables(): Promise<void> {
    const practice = await pokerTableRepository.listPracticeOpen();
    for (const row of practice) {
      await this.retirePracticeTable(row.tableId);
    }

    const existing = await pokerTableRepository.listOpen();
    const openTypes = new Set(existing.map((row) => row.gameType));

    for (const preset of CASH_LOBBY_TABLES) {
      const already = await pokerTableRepository.findByTableId(preset.tableId);
      if (already) {
        if (already.status === 'closed' || already.fillBots) {
          await pokerTableRepository.upsertSnapshot(preset.tableId, {
            name: preset.name,
            gameType: preset.gameType,
            maxSeats: preset.maxSeats,
            fillBots: false,
            status: 'open',
            seatedCount: 0,
          });
        }
        openTypes.add(preset.gameType);
        continue;
      }
      if (openTypes.has(preset.gameType)) continue;
      await this.createTableInternal({
        tableId: preset.tableId,
        ...defaultTableConfig(preset.gameType, {
          name: preset.name,
          fillBots: false,
          maxSeats: preset.maxSeats,
        }),
      });
      openTypes.add(preset.gameType);
    }

    const open = await pokerTableRepository.listOpen();
    for (const row of open) {
      if (memoryTables.has(row.tableId)) {
        const live = memoryTables.get(row.tableId);
        if (live) {
          live.config.fillBots = false;
          live.players = live.players.filter((player) => !player.isBot && !isBotId(player.userId));
        }
        continue;
      }
      const cached = await redisLockService.getJson<TableState>(POKER_REDIS_KEYS.state(row.tableId));
      if (cached) {
        cached.config.fillBots = false;
        cached.players = cached.players.filter((player) => !player.isBot && !isBotId(player.userId));
        memoryTables.set(row.tableId, cached);
        continue;
      }
      const restored = createTableState({
        tableId: row.tableId,
        name: row.name,
        gameType: row.gameType,
        maxSeats: row.maxSeats,
        minSeatsToStart: 2,
        smallBlind: row.smallBlind,
        bigBlind: row.bigBlind,
        buyInMin: row.buyInMin,
        buyInMax: row.buyInMax,
        actionTimeoutMs: row.actionTimeoutMs,
        fillBots: false,
      });
      const seated = await pokerPlayerSessionRepository.findSeatedByTable(row.tableId);
      for (const session of seated) {
        if (isBotId(session.userId)) continue;
        if (restored.players.some((player) => player.userId === session.userId)) continue;
        sitPlayer(restored, {
          userId: session.userId,
          username: session.username,
          chips: session.chips,
          seatIndex: session.seatIndex,
        });
      }
      memoryTables.set(row.tableId, restored);
      await redisLockService.setJson(POKER_REDIS_KEYS.state(row.tableId), restored, TABLE_TTL_SEC);
    }
  }

  private async retirePracticeTable(tableId: string): Promise<void> {
    const timer = timers.get(tableId);
    if (timer) clearTimeout(timer);
    timers.delete(tableId);
    memoryTables.delete(tableId);
    await pokerTableRepository.upsertSnapshot(tableId, {
      status: 'closed',
      fillBots: false,
      seatedCount: 0,
    });
    await pokerPlayerSessionRepository.markLeftByTable(tableId);
    await redisLockService.deleteKey(POKER_REDIS_KEYS.state(tableId));
  }

  private async createTableInternal(configInput: Omit<TableConfig, 'tableId'> & { tableId?: string }): Promise<TableState> {
    const tableId = configInput.tableId || randomUUID();
    const config: TableConfig = { ...configInput, tableId };
    const state = createTableState(config);
    fillBotsIfNeeded(state);
    await pokerTableRepository.create({
      tableId,
      name: config.name,
      gameType: config.gameType,
      maxSeats: config.maxSeats,
      smallBlind: config.smallBlind,
      bigBlind: config.bigBlind,
      buyInMin: config.buyInMin,
      buyInMax: config.buyInMax,
      actionTimeoutMs: config.actionTimeoutMs,
      fillBots: config.fillBots,
      status: 'open',
      seatedCount: 0,
    } as never);
    await persistState(state);
    return state;
  }

  async listTables(gameType?: PokerGameType) {
    await this.ensureLobbyTables();
    const rows = await pokerTableRepository.listOpen(gameType);
    return rows.map((row) => {
      const live = memoryTables.get(row.tableId);
      const players = (live?.players ?? []).filter((player) => !player.isBot && !isBotId(player.userId));
      return {
        tableId: row.tableId,
        name: row.name,
        gameType: row.gameType,
        blinds: { small: row.smallBlind, big: row.bigBlind },
        buyIn: { min: row.buyInMin, max: row.buyInMax },
        playersSeated: live ? players.length : row.seatedCount,
        maxSeats: row.maxSeats,
        status: live?.status || row.status,
        fillBots: false,
        pot: live?.pot ?? 0,
        street: live?.street ?? 'waiting',
        handNumber: live?.handNumber ?? 0,
        players: players
          .map((player) => ({
            username: player.username,
            chips: player.chips,
            isBot: false,
            seatIndex: player.seatIndex,
          }))
          .sort((a, b) => a.seatIndex - b.seatIndex),
      };
    });
  }

  async createTable(
    userId: string,
    input: {
      gameType: PokerGameType;
      name?: string;
      maxSeats?: number;
      smallBlind?: number;
      bigBlind?: number;
      buyInMin?: number;
      buyInMax?: number;
      fillBots?: boolean;
    }
  ) {
    const config = defaultTableConfig(input.gameType, {
      name: input.name,
      maxSeats: input.maxSeats,
      smallBlind: input.smallBlind,
      bigBlind: input.bigBlind,
      buyInMin: input.buyInMin,
      buyInMax: input.buyInMax,
      fillBots: false,
    });
    const state = await this.createTableInternal(config);
    return sanitizeTableState(state, userId);
  }

  async getTable(tableId: string, userId?: string): Promise<PublicTableState> {
    const state = await requireState(tableId);
    return sanitizeTableState(state, userId);
  }

  async sit(
    userId: string,
    username: string,
    avatar: string,
    tableId: string,
    buyIn: number,
    seatIndex?: number
  ): Promise<PublicTableState> {
    const existing = await pokerPlayerSessionRepository.findActiveByUser(userId);
    if (existing && existing.tableId !== tableId) {
      await this.leave(userId, existing.tableId);
    }

    return withLock(tableId, async () => {
      const state = await requireState(tableId);
      if (state.players.some((player) => player.userId === userId)) {
        return sanitizeTableState(state, userId);
      }

      const debit = await economyService.debitCoinsAtomic(
        userId,
        buyIn,
        'poker_buyin',
        'Poker table buy-in',
        { tableId, gameId: POKER_GAME_ID }
      );

      try {
        sitPlayer(state, { userId, username, avatar, chips: buyIn, seatIndex });
        await pokerPlayerSessionRepository.create({
          tableId,
          userId,
          username,
          seatIndex: state.players.find((player) => player.userId === userId)!.seatIndex,
          buyIn,
          chips: buyIn,
          status: 'seated',
          joinedAt: new Date(),
        } as never);
        fillBotsIfNeeded(state);
        await afterMutation(state, [
          { type: 'player-joined', userId },
          { type: 'state' },
          { type: 'balance-update', userId, balance: debit.coins },
        ]);
        if (canStartHand(state) && (state.street === 'waiting' || state.street === 'complete')) {
          await this.startHandLocked(state);
        }
        return sanitizeTableState(state, userId);
      } catch (error) {
        await economyService.creditCoinsAtomic(
          userId,
          buyIn,
          'poker_refund',
          'Poker buy-in refund',
          { tableId, gameId: POKER_GAME_ID }
        );
        throw error;
      }
    });
  }

  async leave(userId: string, tableId: string): Promise<{ chipsReturned: number; balance?: number }> {
    return withLock(tableId, async () => {
      const state = await requireState(tableId);
      const player = state.players.find((item) => item.userId === userId);
      if (!player) return { chipsReturned: 0 };

      if (state.handId && player.status !== 'folded' && player.status !== 'waiting' && state.street !== 'complete') {
        if (state.currentPlayerId === userId) {
          applyAction(state, userId, { type: 'fold' });
        } else {
          player.status = 'folded';
        }
      }

      const chips = player.chips;
      removePlayer(state, userId);
      await pokerPlayerSessionRepository.markLeft(tableId, userId, chips);

      let balance: number | undefined;
      if (!isBotId(userId) && chips > 0) {
        const credit = await economyService.creditCoinsAtomic(
          userId,
          chips,
          'poker_win',
          'Poker table cash-out',
          { tableId, gameId: POKER_GAME_ID }
        );
        balance = credit.coins;
      }

      await afterMutation(state, [
        { type: 'player-left', userId },
        { type: 'state' },
        ...(balance != null ? [{ type: 'balance-update' as const, userId, balance }] : []),
      ]);
      return { chipsReturned: chips, balance };
    });
  }

  async action(userId: string, tableId: string, input: PokerActionInput): Promise<PublicTableState> {
    return withLock(tableId, async () => {
      const state = await requireState(tableId);
      const previousStreet = state.street;
      applyAction(state, userId, input);
      await persistAction(state, userId, input);

      const events: PokerRuntimeEvent[] = [
        { type: 'action-accepted', userId, action: input },
        { type: 'pot-update' },
        { type: 'state' },
      ];
      if (state.street !== previousStreet && ['flop', 'turn', 'river'].includes(state.street)) {
        events.push({ type: 'community' });
      }
      if (previousStreet === 'draw' && state.street === 'draw-betting') {
        events.push({ type: 'draw-complete' });
      }
      if (state.street === 'showdown' || state.street === 'complete') {
        events.push({ type: 'showdown' }, { type: 'hand-result' });
        await persistHandEnd(state);
      }
      if (state.currentPlayerId) events.push({ type: 'turn' }, { type: 'timer' });

      await afterMutation(state, events);
      return sanitizeTableState(state, userId);
    });
  }

  async reconnect(userId: string, tableId?: string): Promise<PublicTableState | null> {
    const session = tableId
      ? await pokerPlayerSessionRepository.findActive(tableId, userId)
      : await pokerPlayerSessionRepository.findActiveByUser(userId);
    if (!session) return null;
    const state = await loadState(session.tableId);
    if (!state) return null;
    return sanitizeTableState(state, userId);
  }

  async history(userId: string, tableId?: string, limit = 20) {
    const hands = tableId
      ? await pokerHandRepository.findRecentByTable(tableId, limit)
      : await pokerHandRepository.findRecentByUser(userId, limit);
    const items = [];
    for (const hand of hands) {
      const actions = await pokerActionRepository.findByHand(hand.handId);
      items.push({
        handId: hand.handId,
        tableId: hand.tableId,
        gameType: hand.gameType,
        players: hand.players.map((player) => ({
          userId: player.userId,
          username: player.username,
          seatIndex: player.seatIndex,
        })),
        communityCards: hand.communityCards,
        result: hand.result,
        pots: hand.pots,
        actions: actions.map((action) => ({
          userId: action.userId,
          action: action.action,
          amount: action.amount,
          street: action.street,
          timestamp: action.timestamp,
        })),
        startedAt: hand.startedAt,
        completedAt: hand.completedAt,
      });
    }
    return items;
  }

  async onTimer(tableId: string): Promise<void> {
    try {
      await withLock(tableId, async () => {
        const state = await requireState(tableId);
        if (!state.currentPlayerId) return;
        const actor = state.players.find((player) => player.userId === state.currentPlayerId);
        if (!actor) return;

        const previousStreet = state.street;
        const action = actor.isBot
          ? chooseBotAction(state, actor.userId)
          : { type: 'fold' as const };
        if (!actor.isBot && state.actionDeadline && Date.now() < state.actionDeadline) return;
        if (actor.isBot) {
          applyAction(state, actor.userId, action);
        } else {
          applyTimeout(state);
        }
        await persistAction(state, actor.userId, action);
        const events: PokerRuntimeEvent[] = [
          { type: 'action-accepted', userId: actor.userId, action },
          { type: 'state' },
        ];
        if (state.street !== previousStreet && ['flop', 'turn', 'river'].includes(state.street)) {
          events.push({ type: 'community' });
        }
        if (state.street === 'showdown' || state.street === 'complete') {
          events.push({ type: 'showdown' }, { type: 'hand-result' });
          await persistHandEnd(state);
        }
        if (state.currentPlayerId) events.push({ type: 'turn' }, { type: 'timer' });
        await afterMutation(state, events);
      });
    } catch (error) {
      console.warn('[poker] timer failed', error);
    }
  }

  async beginNextHand(tableId: string): Promise<void> {
    try {
      await withLock(tableId, async () => {
        const state = await requireState(tableId);
        if (!canStartHand(state) && state.street !== 'complete' && state.street !== 'waiting') return;
        if (state.street === 'complete') prepareNextHand(state);
        if (!canStartHand(state)) {
          await persistState(state);
          return;
        }
        await this.startHandLocked(state);
      });
    } catch (error) {
      console.warn('[poker] next hand failed', error);
    }
  }

  private async startHandLocked(state: TableState): Promise<void> {
    prepareNextHand(state);
    startHand(state);
    await persistHandStart(state);
    await afterMutation(state, [
      { type: 'hand-start' },
      { type: 'cards-dealt' },
      { type: 'turn' },
      { type: 'timer' },
      { type: 'state' },
    ]);
  }
}

export const pokerService = new PokerService();
export { sanitizeTableState };
