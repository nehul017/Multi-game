import { registerBuiltInGames } from '../../games/core/register-games';
import { gameRegistry } from '../../games/core/registry';
import { gameSessionStore } from '../../games/core/session-store';
import { parseIncomingAction, validateGameAction } from '../../games/core/validator';
import { GAME_ERROR_CODES } from '../../games/core/errors';
import { gameRedisService } from '../../services/game-redis.service';
import type { GameRoom } from '../../games/core/types';
import { Mindi } from '../../games/mindi/engine';
import { getBotMove } from '../../games/mindi/bot';
import { serializeGameState } from '../../games/factory';

describe('Mindi lifecycle', () => {
  const seats = ['alice', 'bot:mindi:room:1', 'bot:mindi:room:2', 'bot:mindi:room:3'];

  beforeAll(() => {
    registerBuiltInGames();
  });

  beforeEach(() => {
    gameSessionStore.clear();
    gameRedisService.clearMemory();
  });

  const createRoom = (): GameRoom => {
    const engine = gameRegistry.createEngine('mindi', seats, { deckSeed: 'life-seed' });
    const room: GameRoom = {
      matchId: 'match-mindi',
      roomId: 'room-mindi',
      gameType: 'mindi',
      players: new Map([
        [seats[0], { socketId: 's1', ready: true, connected: true }],
        [seats[1], { socketId: '', ready: true, connected: true }],
        [seats[2], { socketId: '', ready: true, connected: true }],
        [seats[3], { socketId: '', ready: true, connected: true }],
      ]),
      gameState: {},
      spectators: new Set(),
      engine,
      lifecycle: 'active',
      settings: { _deckSeed: 'life-seed', seatOrder: seats },
    };
    gameSessionStore.set(room);
    return room;
  };

  it('registers mindi and creates a 4-seat engine', () => {
    expect(gameRegistry.has('mindi')).toBe(true);
    const engine = gameRegistry.createEngine('mindi', seats, { deckSeed: 'reg' });
    expect(engine).toBeInstanceOf(Mindi);
    expect(engine?.getCurrentPlayer()).toBe(seats[1]);
  });

  it('rejects a forged playerId and an off-turn action', () => {
    const room = createRoom();
    const parsed = parseIncomingAction({
      roomId: room.roomId,
      actionId: 'x1',
      type: 'play-card',
      payload: { cardId: 'AH', playerId: seats[1] },
      timestamp: Date.now(),
    });
    expect(parsed?.moveData.playerId).toBeUndefined();

    try {
      validateGameAction({
        userId: seats[0],
        room,
        action: { actionId: 'x2', type: 'play-card', payload: { cardId: 'AH' }, timestamp: Date.now() },
        seenAction: false,
      });
      throw new Error('expected off-turn rejection');
    } catch (error) {
      expect((error as { code?: string }).code).toBe(GAME_ERROR_CODES.ACTION_NOT_ALLOWED);
      expect((error as Error).message).toBe('It is not your turn');
    }
  });

  it('ignores a duplicate actionId and locks a second simultaneous play', async () => {
    const room = createRoom();
    const current = room.engine!.getCurrentPlayer();
    const move = room.engine!.getValidMoves(current)[0];
    await gameRedisService.markActionSeen(room.roomId, 'same');
    try {
      validateGameAction({
        userId: current,
        room,
        action: { actionId: 'same', type: 'play-card', payload: move, timestamp: Date.now() },
        seenAction: true,
      });
      throw new Error('expected duplicate rejection');
    } catch (error) {
      expect((error as { code?: string }).code).toBe(GAME_ERROR_CODES.DUPLICATE_ACTION);
    }

    const first = await gameRedisService.acquireActionLock(room.roomId);
    const second = await gameRedisService.acquireActionLock(room.roomId);
    expect(first).toBeTruthy();
    expect(second).toBeNull();
    if (first) await gameRedisService.releaseActionLock(room.roomId, first);
    expect(room.engine?.makeMove(current, move)).toBe(true);
  });

  it('keeps a disconnected seat and restores authorized cards on reclaim', async () => {
    const room = createRoom();
    const slot = room.players.get('alice')!;
    slot.connected = false;
    slot.socketId = '';
    await gameRedisService.saveSession(room);
    expect((await gameRedisService.getSession(room.roomId))?.playerIds).toContain('alice');

    room.players.set('alice', { socketId: 's1-new', ready: true, connected: true });
    const authorized = serializeGameState(room.engine!, 'alice');
    const board = authorized.board as { myHand: Array<{ id: string }>; seats: Array<{ playerId: string }> };
    expect(board.myHand).toHaveLength(13);
    expect(board.seats.find((seat) => seat.playerId === 'alice')).toBeTruthy();
    const other = serializeGameState(room.engine!, 'bot:mindi:room:1').board as { myHand: Array<{ id: string }> };
    expect(other.myHand.map((card) => card.id).sort().join(',')).not.toBe(board.myHand.map((card) => card.id).sort().join(','));
  });

  it('lets a bot take a disconnected human turn without seeing hidden cards', () => {
    const room = createRoom();
    room.botControlled = new Set(['alice']);
    const engine = room.engine as Mindi;
    while (engine.getCurrentPlayer() !== 'alice' && !engine.isGameOver()) {
      const current = engine.getCurrentPlayer();
      const move = getBotMove(engine, current) || engine.getValidMoves(current)[0];
      engine.makeMove(current, move);
    }
    if (engine.isGameOver()) return;
    const view = engine.getBotView('alice')!;
    expect(view.hand).toHaveLength(engine.getHandsForTests()[0].length);
    const move = getBotMove(engine, 'alice');
    expect(move?.cardId).toBeTruthy();
  });

  it('persists a public result shape for Mongo replay data', () => {
    const engine = new Mindi(seats, { deckSeed: 'persist-seed' });
    let guard = 0;
    while (!engine.isGameOver() && guard < 60) {
      const current = engine.getCurrentPlayer();
      engine.makeMove(current, engine.getValidMoves(current)[0]);
      guard += 1;
    }
    const meta = engine.getGameState().metadata;
    expect(meta.capturedTens).toBeDefined();
    expect(meta.tricksWon).toBeDefined();
    expect(engine.getGameState().status === 'finished' || engine.getGameState().status === 'draw').toBe(true);
  });

  it('starts a rematch as a fresh deal', () => {
    const first = new Mindi(seats, { deckSeed: 'deal-a' });
    const rematch = new Mindi(seats, { deckSeed: 'deal-b' });
    expect(first.getHandsForTests()[0].map((card) => card.id).join(',')).not.toBe(
      rematch.getHandsForTests()[0].map((card) => card.id).join(',')
    );
    expect(rematch.getGameState().moveHistory).toHaveLength(0);
  });
});
