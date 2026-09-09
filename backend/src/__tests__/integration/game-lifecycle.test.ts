import { TicTacToe } from '../../games/tic-tac-toe';
import { registerBuiltInGames } from '../../games/core/register-games';
import { gameRegistry } from '../../games/core/registry';
import { gameSessionStore } from '../../games/core/session-store';
import { parseIncomingAction, validateGameAction } from '../../games/core/validator';
import { GAME_ERROR_CODES } from '../../games/core/errors';
import { gameRedisService } from '../../services/game-redis.service';
import type { GameRoom } from '../../games/core/types';

describe('Game lifecycle integration (tic-tac-toe)', () => {
  const p1 = 'alice';
  const p2 = 'bob';

  beforeAll(() => {
    registerBuiltInGames();
  });

  beforeEach(() => {
    gameSessionStore.clear();
    gameRedisService.clearMemory();
  });

  const createRoom = (): GameRoom => {
    const engine = gameRegistry.createEngine('tic-tac-toe', [p1, p2]);
    const room: GameRoom = {
      matchId: 'match-ttt',
      roomId: 'room-ttt',
      gameType: 'tic-tac-toe',
      players: new Map([
        [p1, { socketId: 's1', ready: true, connected: true }],
        [p2, { socketId: 's2', ready: true, connected: true }],
      ]),
      gameState: {},
      spectators: new Set(),
      engine,
      lifecycle: 'active',
    };
    gameSessionStore.set(room);
    return room;
  };

  const apply = (room: GameRoom, userId: string, actionId: string, payload: Record<string, unknown>) => {
    const parsed = parseIncomingAction({
      gameId: 'tic-tac-toe',
      matchId: room.matchId,
      roomId: room.roomId,
      playerId: 'forged-id',
      actionId,
      type: 'place',
      payload,
      timestamp: Date.now(),
    });
    expect(parsed).not.toBeNull();
    validateGameAction({
      userId,
      room,
      action: {
        actionId: parsed!.actionId || actionId,
        type: parsed!.action,
        payload: parsed!.moveData,
        timestamp: parsed!.timestamp ?? Date.now(),
      },
      seenAction: false,
    });
    expect(room.engine?.makeMove(userId, parsed!.moveData)).toBe(true);
  };

  it('creates, joins conceptually, plays, and finishes with a server-side winner', async () => {
    const room = createRoom();
    expect(gameSessionStore.get(room.roomId)?.players.size).toBe(2);

    await gameRedisService.saveSession(room);
    expect((await gameRedisService.getSession(room.roomId))?.lifecycle).toBe('active');

    apply(room, p1, 'a1', { row: 0, col: 0 });
    apply(room, p2, 'a2', { row: 1, col: 0 });
    apply(room, p1, 'a3', { row: 0, col: 1 });
    apply(room, p2, 'a4', { row: 1, col: 1 });
    apply(room, p1, 'a5', { row: 0, col: 2 });

    expect(room.engine?.isGameOver()).toBe(true);
    expect(room.engine?.getGameState().winner).toBe(p1);
    expect(room.engine?.getGameState().winner).not.toBe('forged-id');
  });

  it('rejects an invalid and a duplicate action during the same match', async () => {
    const room = createRoom();
    apply(room, p1, 'first', { row: 0, col: 0 });

    expect(room.engine?.makeMove(p2, { row: 0, col: 0 })).toBe(false);

    await gameRedisService.markActionSeen(room.roomId, 'first');
    expect(await gameRedisService.wasActionSeen(room.roomId, 'first')).toBe(true);

    try {
      validateGameAction({
        userId: p2,
        room,
        action: { actionId: 'first', type: 'place', payload: { row: 2, col: 2 }, timestamp: Date.now() },
        seenAction: true,
      });
      throw new Error('expected duplicate action to fail');
    } catch (error) {
      expect((error as { code?: string }).code).toBe(GAME_ERROR_CODES.DUPLICATE_ACTION);
    }
  });

  it('keeps a disconnected player slot for reconnect', () => {
    const room = createRoom();
    const slot = room.players.get(p1)!;
    slot.connected = false;
    slot.socketId = '';
    slot.disconnectedAt = Date.now();
    expect(room.players.has(p1)).toBe(true);

    room.players.set(p1, { socketId: 's1-new', ready: true, connected: true });
    expect(room.players.get(p1)?.connected).toBe(true);
    expect(room.engine?.getGameState().status).toBe('playing');
  });

  it('computes a draw without trusting the client', () => {
    const engine = new TicTacToe([p1, p2]);
    const moves: Array<[string, number, number]> = [
      [p1, 0, 0],
      [p2, 0, 1],
      [p1, 0, 2],
      [p2, 1, 1],
      [p1, 1, 0],
      [p2, 1, 2],
      [p1, 2, 1],
      [p2, 2, 0],
      [p1, 2, 2],
    ];
    for (const [player, row, col] of moves) {
      expect(engine.makeMove(player, { row, col })).toBe(true);
    }
    expect(engine.getGameState().status).toBe('draw');
    expect(engine.getGameState().winner).toBeNull();
  });
});
