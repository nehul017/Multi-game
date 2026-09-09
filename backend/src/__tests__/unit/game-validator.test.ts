import { TicTacToe } from '../../games/tic-tac-toe';
import { GAME_ERROR_CODES, GameError } from '../../games/core/errors';
import { parseIncomingAction, stripUntrustedActionFields, validateGameAction } from '../../games/core/validator';
import type { GameRoom } from '../../games/core/types';

const roomWith = (engine: TicTacToe, extras: Partial<GameRoom> = {}): GameRoom => ({
  matchId: 'm1',
  roomId: 'r1',
  gameType: 'tic-tac-toe',
  players: new Map([
    ['p1', { socketId: 's1', ready: true, connected: true }],
    ['p2', { socketId: 's2', ready: true, connected: true }],
  ]),
  gameState: {},
  spectators: new Set(),
  engine,
  ...extras,
});

describe('GameValidator', () => {
  it('parses legacy makeMove payloads', () => {
    const parsed = parseIncomingAction({
      roomId: 'r1',
      action: 'place',
      moveData: { row: 0, col: 1, score: 999, _forcedDice: 6 },
    });
    expect(parsed?.roomId).toBe('r1');
    expect(parsed?.moveData.row).toBe(0);
    expect(parsed?.moveData.score).toBeUndefined();
    expect(parsed?.moveData._forcedDice).toBeUndefined();
  });

  it('parses standardized GameAction payloads', () => {
    const parsed = parseIncomingAction({
      gameId: 'tic-tac-toe',
      matchId: 'm1',
      roomId: 'r1',
      actionId: 'act-1',
      type: 'place',
      payload: { row: 1, col: 1, winner: 'p1' },
      timestamp: Date.now(),
    });
    expect(parsed?.actionId).toBe('act-1');
    expect(parsed?.action).toBe('place');
    expect(parsed?.moveData.winner).toBeUndefined();
  });

  it('strips client-trusted identity and score fields', () => {
    const clean = stripUntrustedActionFields({
      row: 0,
      playerId: 'hacker',
      coins: 999999,
      result: 'win',
    });
    expect(clean.row).toBe(0);
    expect(clean.playerId).toBeUndefined();
    expect(clean.coins).toBeUndefined();
  });

  it('rejects actions from players not in the room', () => {
    const engine = new TicTacToe(['p1', 'p2']);
    expect(() =>
      validateGameAction({
        userId: 'p3',
        room: roomWith(engine),
        action: { actionId: 'a', type: 'place', payload: {}, timestamp: Date.now() },
        seenAction: false,
      })
    ).toThrow(GameError);
  });

  it('rejects duplicate action ids', () => {
    const engine = new TicTacToe(['p1', 'p2']);
    try {
      validateGameAction({
        userId: 'p1',
        room: roomWith(engine),
        action: { actionId: 'dup', type: 'place', payload: {}, timestamp: Date.now() },
        seenAction: true,
      });
      throw new Error('expected duplicate action to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(GameError);
      expect((error as GameError).code).toBe(GAME_ERROR_CODES.DUPLICATE_ACTION);
    }
  });

  it('rejects stale timestamps', () => {
    const engine = new TicTacToe(['p1', 'p2']);
    try {
      validateGameAction({
        userId: 'p1',
        room: roomWith(engine),
        action: { actionId: 'old', type: 'place', payload: {}, timestamp: Date.now() - 60_000 },
        seenAction: false,
      });
      throw new Error('expected stale timestamp to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(GameError);
      expect((error as GameError).code).toBe(GAME_ERROR_CODES.INVALID_TIMESTAMP);
    }
  });

  it('rejects out-of-turn actions for turn-based games', () => {
    const engine = new TicTacToe(['p1', 'p2']);
    try {
      validateGameAction({
        userId: 'p2',
        room: roomWith(engine),
        action: { actionId: 't', type: 'place', payload: {}, timestamp: Date.now() },
        seenAction: false,
      });
      throw new Error('expected out-of-turn action to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(GameError);
      expect((error as GameError).code).toBe(GAME_ERROR_CODES.ACTION_NOT_ALLOWED);
    }
  });

  it('accepts a valid in-turn action', () => {
    const engine = new TicTacToe(['p1', 'p2']);
    expect(() =>
      validateGameAction({
        userId: 'p1',
        room: roomWith(engine),
        action: { actionId: 'ok', type: 'place', payload: { row: 0, col: 0 }, timestamp: Date.now() },
        seenAction: false,
      })
    ).not.toThrow();
  });
});
