import { getRedisClient, isRedisAvailable } from '../config/redis';

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

const now = (): number => Date.now();

const pruneExpired = (): void => {
  const ts = now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt <= ts) {
      memoryStore.delete(key);
    }
  }
};

const memoryGet = (key: string): string | null => {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
};

const memorySet = (key: string, value: string, ttlMs: number): void => {
  memoryStore.set(key, { value, expiresAt: now() + ttlMs });
};

const memorySetNx = (key: string, value: string, ttlMs: number): boolean => {
  if (memoryGet(key) !== null) return false;
  memorySet(key, value, ttlMs);
  return true;
};

class RedisLockService {
  async acquireLock(key: string, ttlMs: number, token: string): Promise<boolean> {
    if (isRedisAvailable()) {
      try {
        const result = await getRedisClient().set(key, token, 'PX', ttlMs, 'NX');
        return result === 'OK';
      } catch (error) {
        console.warn('[redis-lock] acquireLock redis failed, using memory', error);
      }
    }
    pruneExpired();
    return memorySetNx(key, token, ttlMs);
  }

  async releaseLock(key: string, token: string): Promise<void> {
    if (isRedisAvailable()) {
      try {
        const script = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          end
          return 0
        `;
        await getRedisClient().eval(script, 1, key, token);
        return;
      } catch (error) {
        console.warn('[redis-lock] releaseLock redis failed, using memory', error);
      }
    }

    const current = memoryGet(key);
    if (current === token) {
      memoryStore.delete(key);
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (isRedisAvailable()) {
      try {
        const raw = await getRedisClient().get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch (error) {
        console.warn('[redis-lock] getJson redis failed, using memory', error);
      }
    }

    const raw = memoryGet(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSec: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (isRedisAvailable()) {
      try {
        await getRedisClient().set(key, serialized, 'EX', ttlSec);
        return;
      } catch (error) {
        console.warn('[redis-lock] setJson redis failed, using memory', error);
      }
    }
    memorySet(key, serialized, ttlSec * 1000);
  }

  async incrementWithTtl(key: string, ttlSec: number): Promise<number> {
    if (isRedisAvailable()) {
      try {
        const client = getRedisClient();
        const count = await client.incr(key);
        if (count === 1) {
          await client.expire(key, ttlSec);
        }
        return count;
      } catch (error) {
        console.warn('[redis-lock] incrementWithTtl redis failed, using memory', error);
      }
    }

    const current = Number(memoryGet(key) || '0');
    const next = current + 1;
    const remaining = memoryStore.get(key);
    const ttlMs = remaining ? Math.max(remaining.expiresAt - now(), ttlSec * 1000) : ttlSec * 1000;
    memorySet(key, String(next), current === 0 ? ttlSec * 1000 : ttlMs);
    return next;
  }

  /** Test helper — clears in-memory fallback only. */
  clearMemory(): void {
    memoryStore.clear();
  }
}

export const redisLockService = new RedisLockService();

export const SLOT_REDIS_KEYS = {
  lock: (userId: string) => `slots:lock:${userId}`,
  idempotency: (userId: string, requestId: string) => `slots:idem:${userId}:${requestId}`,
  session: (userId: string, gameId: string) => `slots:session:${userId}:${gameId}`,
  state: (userId: string, gameId: string) => `slots:state:${userId}:${gameId}`,
  rate: (userId: string) => `slots:rate:${userId}`,
};
