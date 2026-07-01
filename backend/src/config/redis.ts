import Redis from 'ioredis';
import { env } from './env';

let redisClient: Redis | null = null;
let redisReady = false;

const REDIS_CONNECT_TIMEOUT_MS = 5000;

export const isRedisAvailable = (): boolean => redisReady;

export const connectRedis = async (): Promise<boolean> => {
  if (redisReady && redisClient) return true;

  const client = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 3,
    connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 200, 5000);
    },
    reconnectOnError(err) {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some((e) => err.message.includes(e));
    },
  });

  client.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });

  client.on('close', () => {
    console.warn('Redis connection closed');
  });

  client.on('reconnecting', () => {
    console.log('Redis reconnecting...');
  });

  try {
    await client.connect();
    await client.ping();
    redisClient = client;
    redisReady = true;
    console.log('Redis connected');
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Redis unavailable (${message}), continuing without Redis`);
    client.disconnect();
    redisClient = null;
    redisReady = false;
    return false;
  }
};

export const getRedisClient = (): Redis => {
  if (!redisClient || !redisReady) {
    throw new Error('Redis client not available');
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    redisReady = false;
    console.log('Redis disconnected');
  }
};
