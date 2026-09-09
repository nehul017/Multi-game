import { v4 as uuidv4 } from 'uuid';
import { getRedisClient, isRedisAvailable } from '../config/redis';
import { env } from '../config/env';
import { gameLogger } from '../games/core/logger';
import { GAME_ERROR_CODES, GameError } from '../games/core/errors';
import type { GameRoom, GameSessionMeta, RemoteGameCommand } from '../games/core/types';
import { redisLockService } from './redis-lock.service';

export const GAME_REDIS_KEYS = {
  meta: (roomId: string) => `game:${roomId}:meta`,
  players: (roomId: string) => `game:${roomId}:players`,
  lock: (roomId: string) => `game:${roomId}:lock`,
  actions: (roomId: string) => `game:${roomId}:actions`,
  checkpoint: (roomId: string) => `game:${roomId}:checkpoint`,
  playerGames: (playerId: string) => `player:${playerId}:games`,
  presence: (playerId: string) => `player:${playerId}:presence`,
  reconnect: (playerId: string) => `player:${playerId}:reconnect`,
  matchmaking: (gameType: string) => `matchmaking:${gameType}`,
  matchmakingRooms: (gameType: string) => `matchmaking:${gameType}:rooms`,
  socketUser: (socketId: string) => `socket:${socketId}:user`,
  commandChannel: () => 'game:cmd',
};

const SESSION_TTL_SEC = 6 * 60 * 60;
const ACTION_TTL_SEC = 30 * 60;
const PRESENCE_TTL_SEC = 90;
const RECONNECT_TTL_SEC = 120;
const QUEUE_TTL_SEC = 10 * 60;

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

const memory = new Map<string, MemoryEntry>();
const memorySets = new Map<string, Set<string>>();
const commandHandlers = new Set<(command: RemoteGameCommand) => void>();

const now = (): number => Date.now();

const memoryGet = (key: string): string | null => {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
};

const memorySet = (key: string, value: string, ttlSec: number): void => {
  memory.set(key, { value, expiresAt: now() + ttlSec * 1000 });
};

const setAdd = (key: string, member: string): void => {
  if (!memorySets.has(key)) memorySets.set(key, new Set());
  memorySets.get(key)!.add(member);
};

const setRemove = (key: string, member: string): void => {
  memorySets.get(key)?.delete(member);
};

class GameRedisService {
  readonly instanceId = env.instanceId;

  async saveSession(room: GameRoom, extras: Partial<GameSessionMeta> = {}): Promise<void> {
    const meta: GameSessionMeta = {
      roomId: room.roomId,
      matchId: room.matchId,
      gameType: room.gameType,
      ownerInstanceId: extras.ownerInstanceId || this.instanceId,
      status: room.engine ? 'playing' : extras.status || 'waiting',
      lifecycle: extras.lifecycle || room.lifecycle || (room.engine ? 'active' : 'waiting'),
      playerIds: Array.from(room.players.keys()),
      settings: room.settings,
      updatedAt: Date.now(),
    };

    const players = Array.from(room.players.entries()).map(([userId, slot]) => ({
      userId,
      connected: slot.connected,
      ready: slot.ready,
    }));

    try {
      await redisLockService.setJson(GAME_REDIS_KEYS.meta(room.roomId), meta, SESSION_TTL_SEC);
      await redisLockService.setJson(GAME_REDIS_KEYS.players(room.roomId), players, SESSION_TTL_SEC);
      if (isRedisAvailable()) {
        const client = getRedisClient();
        const roomSet = GAME_REDIS_KEYS.matchmakingRooms(room.gameType);
        if (!room.engine) {
          await client.sadd(roomSet, room.roomId);
          await client.expire(roomSet, QUEUE_TTL_SEC);
        } else {
          await client.srem(roomSet, room.roomId);
        }
        for (const userId of meta.playerIds) {
          await client.sadd(GAME_REDIS_KEYS.playerGames(userId), room.roomId);
          await client.expire(GAME_REDIS_KEYS.playerGames(userId), SESSION_TTL_SEC);
        }
      } else {
        if (!room.engine) setAdd(GAME_REDIS_KEYS.matchmakingRooms(room.gameType), room.roomId);
        else setRemove(GAME_REDIS_KEYS.matchmakingRooms(room.gameType), room.roomId);
        for (const userId of meta.playerIds) {
          setAdd(GAME_REDIS_KEYS.playerGames(userId), room.roomId);
        }
      }
    } catch (error) {
      gameLogger.warn('redis_error', { op: 'saveSession', roomId: room.roomId, error: String(error) });
    }
  }

  async getSession(roomId: string): Promise<GameSessionMeta | null> {
    return redisLockService.getJson<GameSessionMeta>(GAME_REDIS_KEYS.meta(roomId));
  }

  async deleteSession(room: Pick<GameRoom, 'roomId' | 'gameType' | 'players'>): Promise<void> {
    try {
      await redisLockService.deleteKey(GAME_REDIS_KEYS.meta(room.roomId));
      await redisLockService.deleteKey(GAME_REDIS_KEYS.players(room.roomId));
      await redisLockService.deleteKey(GAME_REDIS_KEYS.checkpoint(room.roomId));
      await redisLockService.deleteKey(GAME_REDIS_KEYS.actions(room.roomId));
      if (isRedisAvailable()) {
        const client = getRedisClient();
        await client.srem(GAME_REDIS_KEYS.matchmakingRooms(room.gameType), room.roomId);
        for (const userId of room.players.keys()) {
          await client.srem(GAME_REDIS_KEYS.playerGames(userId), room.roomId);
        }
      } else {
        setRemove(GAME_REDIS_KEYS.matchmakingRooms(room.gameType), room.roomId);
        for (const userId of room.players.keys()) {
          setRemove(GAME_REDIS_KEYS.playerGames(userId), room.roomId);
        }
      }
    } catch (error) {
      gameLogger.warn('redis_error', { op: 'deleteSession', roomId: room.roomId, error: String(error) });
    }
  }

  async saveCheckpoint(roomId: string, state: unknown): Promise<void> {
    try {
      await redisLockService.setJson(GAME_REDIS_KEYS.checkpoint(roomId), state, SESSION_TTL_SEC);
    } catch (error) {
      gameLogger.warn('redis_error', { op: 'saveCheckpoint', roomId, error: String(error) });
    }
  }

  async markActionSeen(roomId: string, actionId: string): Promise<boolean> {
    const key = GAME_REDIS_KEYS.actions(roomId);
    if (isRedisAvailable()) {
      try {
        const added = await getRedisClient().sadd(key, actionId);
        await getRedisClient().expire(key, ACTION_TTL_SEC);
        return added === 1;
      } catch (error) {
        gameLogger.warn('redis_error', { op: 'markActionSeen', roomId, error: String(error) });
      }
    }
    const before = memorySets.get(key)?.has(actionId) ?? false;
    setAdd(key, actionId);
    return !before;
  }

  async wasActionSeen(roomId: string, actionId: string): Promise<boolean> {
    const key = GAME_REDIS_KEYS.actions(roomId);
    if (isRedisAvailable()) {
      try {
        return (await getRedisClient().sismember(key, actionId)) === 1;
      } catch (error) {
        gameLogger.warn('redis_error', { op: 'wasActionSeen', roomId, error: String(error) });
      }
    }
    return memorySets.get(key)?.has(actionId) ?? false;
  }

  async enqueueMatchmaking(gameType: string, userId: string): Promise<void> {
    const key = GAME_REDIS_KEYS.matchmaking(gameType);
    if (isRedisAvailable()) {
      try {
        const client = getRedisClient();
        await client.sadd(key, userId);
        await client.expire(key, QUEUE_TTL_SEC);
        return;
      } catch (error) {
        gameLogger.warn('redis_error', { op: 'enqueueMatchmaking', gameType, error: String(error) });
      }
    }
    setAdd(key, userId);
  }

  async dequeueMatchmaking(gameType: string, userId: string): Promise<void> {
    const key = GAME_REDIS_KEYS.matchmaking(gameType);
    if (isRedisAvailable()) {
      try {
        await getRedisClient().srem(key, userId);
        return;
      } catch (error) {
        gameLogger.warn('redis_error', { op: 'dequeueMatchmaking', gameType, error: String(error) });
      }
    }
    setRemove(key, userId);
  }

  async dequeueUser(userId: string): Promise<void> {
    if (isRedisAvailable()) {
      try {
        const client = getRedisClient();
        const keys = await client.keys('matchmaking:*');
        for (const key of keys) {
          if (key.endsWith(':rooms')) continue;
          await client.srem(key, userId);
        }
        return;
      } catch (error) {
        gameLogger.warn('redis_error', { op: 'dequeueUser', error: String(error) });
      }
    }
    for (const [key, set] of memorySets.entries()) {
      if (key.startsWith('matchmaking:') && !key.endsWith(':rooms')) {
        set.delete(userId);
      }
    }
  }

  async listWaitingRooms(gameType: string): Promise<string[]> {
    const key = GAME_REDIS_KEYS.matchmakingRooms(gameType);
    if (isRedisAvailable()) {
      try {
        return await getRedisClient().smembers(key);
      } catch (error) {
        gameLogger.warn('redis_error', { op: 'listWaitingRooms', gameType, error: String(error) });
      }
    }
    return Array.from(memorySets.get(key) || []);
  }

  async mapSocket(socketId: string, userId: string): Promise<void> {
    try {
      await redisLockService.setJson(GAME_REDIS_KEYS.socketUser(socketId), { userId }, PRESENCE_TTL_SEC);
    } catch (error) {
      gameLogger.warn('redis_error', { op: 'mapSocket', error: String(error) });
    }
  }

  async unmapSocket(socketId: string): Promise<void> {
    try {
      await redisLockService.deleteKey(GAME_REDIS_KEYS.socketUser(socketId));
    } catch (error) {
      gameLogger.warn('redis_error', { op: 'unmapSocket', error: String(error) });
    }
  }

  async setPresence(userId: string, connected: boolean): Promise<void> {
    try {
      await redisLockService.setJson(
        GAME_REDIS_KEYS.presence(userId),
        { connected, at: Date.now() },
        PRESENCE_TTL_SEC
      );
    } catch (error) {
      gameLogger.warn('redis_error', { op: 'setPresence', error: String(error) });
    }
  }

  async setReconnectState(userId: string, roomId: string, matchId: string, gameType: string): Promise<void> {
    try {
      await redisLockService.setJson(
        GAME_REDIS_KEYS.reconnect(userId),
        { roomId, matchId, gameType, at: Date.now() },
        RECONNECT_TTL_SEC
      );
    } catch (error) {
      gameLogger.warn('redis_error', { op: 'setReconnectState', error: String(error) });
    }
  }

  async getReconnectState(userId: string): Promise<{ roomId: string; matchId: string; gameType: string } | null> {
    return redisLockService.getJson(GAME_REDIS_KEYS.reconnect(userId));
  }

  async clearReconnectState(userId: string): Promise<void> {
    try {
      await redisLockService.deleteKey(GAME_REDIS_KEYS.reconnect(userId));
    } catch (error) {
      gameLogger.warn('redis_error', { op: 'clearReconnectState', error: String(error) });
    }
  }

  async acquireActionLock(roomId: string): Promise<string | null> {
    const token = uuidv4();
    const locked = await redisLockService.acquireLock(GAME_REDIS_KEYS.lock(roomId), 4000, token);
    return locked ? token : null;
  }

  async releaseActionLock(roomId: string, token: string): Promise<void> {
    await redisLockService.releaseLock(GAME_REDIS_KEYS.lock(roomId), token);
  }

  async rateLimit(userId: string, maxPerWindow = 40, windowSec = 1): Promise<boolean> {
    const key = `game:rate:${userId}`;
    const count = await redisLockService.incrementWithTtl(key, windowSec);
    return count <= maxPerWindow;
  }

  onRemoteCommand(handler: (command: RemoteGameCommand) => void): () => void {
    commandHandlers.add(handler);
    return () => commandHandlers.delete(handler);
  }

  async publishCommand(command: RemoteGameCommand): Promise<void> {
    if (isRedisAvailable()) {
      try {
        await getRedisClient().publish(GAME_REDIS_KEYS.commandChannel(), JSON.stringify(command));
        return;
      } catch (error) {
        gameLogger.warn('redis_error', { op: 'publishCommand', error: String(error) });
      }
    }
    for (const handler of commandHandlers) handler(command);
  }

  async subscribeCommands(): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
      const sub = getRedisClient().duplicate({ maxRetriesPerRequest: null });
      await sub.subscribe(GAME_REDIS_KEYS.commandChannel());
      sub.on('message', (_channel, message) => {
        try {
          const command = JSON.parse(message) as RemoteGameCommand;
          for (const handler of commandHandlers) handler(command);
        } catch (error) {
          gameLogger.warn('redis_error', { op: 'commandParse', error: String(error) });
        }
      });
    } catch (error) {
      gameLogger.warn('redis_error', { op: 'subscribeCommands', error: String(error) });
      throw new GameError(GAME_ERROR_CODES.REDIS_UNAVAILABLE, 'Could not subscribe to game commands');
    }
  }

  /** Test helper — clears in-memory fallback only. */
  clearMemory(): void {
    memory.clear();
    memorySets.clear();
    commandHandlers.clear();
    redisLockService.clearMemory();
  }
}

export const gameRedisService = new GameRedisService();
