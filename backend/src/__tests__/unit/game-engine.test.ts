import { GameEngine, GameState } from '../../games/engine';

class TestGame extends GameEngine {
  initGame(): void {
    this.state.board = [null, null, null, null];
    this.state.status = 'playing';
  }

  makeMove(player: string, move: Record<string, unknown>): boolean {
    if (!this.validateMove(player, move)) return false;
    const idx = move.index as number;
    (this.state.board as (string | null)[])[idx] = player;
    this.addMoveToHistory(player, 'place', move);
    this.switchPlayer();
    return true;
  }

  validateMove(player: string, move: Record<string, unknown>): boolean {
    if (this.isGameOver()) return false;
    if (player !== this.state.currentPlayer) return false;
    const idx = move.index as number;
    return idx >= 0 && idx < 4 && (this.state.board as (string | null)[])[idx] === null;
  }

  checkWin(): string | null {
    return null;
  }

  checkDraw(): boolean {
    return (this.state.board as (string | null)[]).every(cell => cell !== null);
  }

  getValidMoves(_player: string): Record<string, unknown>[] {
    return (this.state.board as (string | null)[])
      .map((cell, i) => cell === null ? { index: i } : null)
      .filter(Boolean) as Record<string, unknown>[];
  }
}

describe('GameEngine (abstract base)', () => {
  let game: TestGame;
  const p1 = 'alice';
  const p2 = 'bob';

  beforeEach(() => {
    game = new TestGame([p1, p2]);
    game.initGame();
  });

  it('should initialize with correct players', () => {
    const state = game.getGameState();
    expect(state.players).toEqual([p1, p2]);
    expect(state.currentPlayer).toBe(p1);
  });

  it('should switch players correctly', () => {
    game.makeMove(p1, { index: 0 });
    expect(game.getCurrentPlayer()).toBe(p2);
    game.makeMove(p2, { index: 1 });
    expect(game.getCurrentPlayer()).toBe(p1);
  });

  it('should track move history', () => {
    game.makeMove(p1, { index: 0 });
    game.makeMove(p2, { index: 1 });
    const state = game.getGameState();
    expect(state.moveHistory).toHaveLength(2);
    expect(state.moveHistory[0].player).toBe(p1);
    expect(state.moveHistory[1].player).toBe(p2);
  });

  it('should return a copy of state from getGameState', () => {
    const state1 = game.getGameState();
    const state2 = game.getGameState();
    expect(state1).not.toBe(state2);
    expect(state1).toEqual(state2);
  });

  it('should not be game over initially', () => {
    expect(game.isGameOver()).toBe(false);
  });

  it('should report valid moves', () => {
    const moves = game.getValidMoves(p1);
    expect(moves).toHaveLength(4);
  });

  it('should reduce valid moves after placing', () => {
    game.makeMove(p1, { index: 0 });
    const moves = game.getValidMoves(p2);
    expect(moves).toHaveLength(3);
  });
});
