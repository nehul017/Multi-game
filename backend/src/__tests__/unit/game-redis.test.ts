import { gameRedisService } from '../../services/game-redis.service';
import type { GameRoom } from '../../games/core/types';

const makeRoom = (roomId = 'room-1'): GameRoom => ({
  matchId: 'match-1',
  roomId,
  gameType: 'tic-tac-toe',
  players: new Map([
    ['p1', { socketId: 's1', ready: true, connected: true }],
    ['p2', { socketId: 's2', ready: false, connected: true }],
  ]),
  gameState: {},
  spectators: new Set(),
  engine: null,
});

describe('GameRedisService (memory fallback)', () => {
  beforeEach(() => {
    gameRedisService.clearMemory();
  });

  it('persists and reads session metadata', async () => {
    const room = makeRoom();
    await gameRedisService.saveSession(room);
    const meta = await gameRedisService.getSession(room.roomId);
    expect(meta?.matchId).toBe('match-1');
    expect(meta?.playerIds).toEqual(['p1', 'p2']);
    expect(meta?.gameType).toBe('tic-tac-toe');
  });

  it('tracks action idempotency', async () => {
    const first = await gameRedisService.markActionSeen('room-1', 'act-1');
    const second = await gameRedisService.markActionSeen('room-1', 'act-1');
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(await gameRedisService.wasActionSeen('room-1', 'act-1')).toBe(true);
  });

  it('enqueues and dequeues matchmaking', async () => {
    await gameRedisService.enqueueMatchmaking('chess', 'user-1');
    await gameRedisService.dequeueMatchmaking('chess', 'user-1');
    await gameRedisService.dequeueUser('user-1');
  });

  it('stores reconnect state', async () => {
    await gameRedisService.setReconnectState('user-1', 'room-1', 'match-1', 'chess');
    const state = await gameRedisService.getReconnectState('user-1');
    expect(state).toEqual(expect.objectContaining({ roomId: 'room-1', matchId: 'match-1' }));
    await gameRedisService.clearReconnectState('user-1');
    expect(await gameRedisService.getReconnectState('user-1')).toBeNull();
  });

  it('publishes remote commands to local subscribers when Redis is down', async () => {
    const received: string[] = [];
    const stop = gameRedisService.onRemoteCommand((command) => received.push(command.roomId));
    await gameRedisService.publishCommand({
      roomId: 'room-9',
      userId: 'p1',
      username: 'Ada',
      action: 'place',
      moveData: { row: 0, col: 0 },
    });
    expect(received).toEqual(['room-9']);
    stop();
  });

  it('rate limits repeated actions', async () => {
    let allowed = true;
    for (let i = 0; i < 45; i++) {
      allowed = await gameRedisService.rateLimit('spammer', 40, 30);
    }
    expect(allowed).toBe(false);
  });
});
