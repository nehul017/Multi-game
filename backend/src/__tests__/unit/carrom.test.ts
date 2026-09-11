import { Carrom } from '../../games/carrom';
import { simulateShot } from '../../games/carrom/physics';
import { createOpeningPieces } from '../../games/carrom/layout';
import type { CarromBoardState } from '../../games/carrom/types';
import { registerBuiltInGames } from '../../games/core/register-games';
import { gameRegistry } from '../../games/core/registry';

describe('Carrom', () => {
  beforeAll(() => {
    registerBuiltInGames();
  });

  it('registers an authoritative match engine', () => {
    expect(gameRegistry.has('carrom')).toBe(true);
    const engine = gameRegistry.createEngine('carrom', ['p1', 'p2']);
    expect(engine).not.toBeNull();
    expect(engine?.getCurrentPlayer()).toBe('p1');
  });

  it('opens with 19 coins plus a striker', () => {
    const engine = new Carrom(['white-player', 'black-player']);
    const board = engine.getGameState().board as CarromBoardState;
    expect(board.pieces).toHaveLength(20);
    expect(board.pieces.filter((piece) => piece.kind === 'white' && !piece.pocketed)).toHaveLength(9);
    expect(board.pieces.filter((piece) => piece.kind === 'black' && !piece.pocketed)).toHaveLength(9);
    expect(board.pieces.some((piece) => piece.kind === 'queen')).toBe(true);
    expect(board.pointsToWin).toBe(5);
  });

  it('rejects shots that are not the current player', () => {
    const engine = new Carrom(['p1', 'p2']);
    expect(
      engine.makeMove('p2', {
        action: 'shoot',
        shotId: 's1',
        strikerX: 500,
        strikerY: 882,
        angle: -Math.PI / 2,
        power: 0.5,
      })
    ).toBe(false);
  });

  it('accepts a valid break and advances or keeps the turn', () => {
    const engine = new Carrom(['p1', 'p2']);
    const accepted = engine.makeMove('p1', {
      action: 'shoot',
      shotId: 'break-1',
      strikerX: 500,
      strikerY: 882,
      angle: -Math.PI / 2,
      power: 0.72,
    });
    expect(accepted).toBe(true);
    const state = engine.getGameState();
    const board = state.board as CarromBoardState;
    expect(board.lastShot?.shotId).toBe('break-1');
    expect(board.phase === 'aiming' || board.phase === 'board-complete' || board.phase === 'match-complete').toBe(true);
    expect(state.moveHistory).toHaveLength(1);
  });

  it('simulates collisions without sending per-frame snapshots', () => {
    const pieces = createOpeningPieces();
    const result = simulateShot(pieces, {
      shotId: 'phys',
      strikerX: 500,
      strikerY: 882,
      angle: -Math.PI / 2,
      power: 0.8,
    });
    expect(result.durationMs).toBeGreaterThan(0);
    expect(result.events.some((event) => event.type === 'rest')).toBe(true);
    expect(result.pieces).toHaveLength(pieces.length);
  });

  it('prevents a duplicate-looking second shot while resolving via turn checks', () => {
    const engine = new Carrom(['p1', 'p2']);
    engine.makeMove('p1', {
      action: 'shoot',
      shotId: 'a',
      strikerX: 500,
      strikerY: 882,
      angle: -1.4,
      power: 0.4,
    });
    const turn = engine.getCurrentPlayer();
    const rejected = engine.makeMove(turn === 'p1' ? 'p2' : 'p1', {
      action: 'shoot',
      shotId: 'b',
      strikerX: 500,
      strikerY: 118,
      angle: 1.4,
      power: 0.4,
    });
    expect(rejected).toBe(false);
  });

  it('returns the turn after both players miss', () => {
    const engine = new Carrom(['p1', 'p2']);
    const miss = (player: string, shotId: string, y: number, angle: number) =>
      engine.makeMove(player, {
        action: 'shoot',
        shotId,
        strikerX: 200,
        strikerY: y,
        angle,
        power: 0.18,
      });

    expect(miss('p1', 'break-miss', 882, 0)).toBe(true);
    expect(engine.getCurrentPlayer()).toBe('p2');
    expect(miss('p2', 'reply-miss', 118, Math.PI)).toBe(true);
    expect(engine.getCurrentPlayer()).toBe('p1');
    const board = engine.getGameState().board as CarromBoardState;
    const striker = board.pieces.find((piece) => piece.kind === 'striker');
    expect(striker?.y).toBeGreaterThan(800);
    expect(board.phase).toBe('aiming');
  });
});
