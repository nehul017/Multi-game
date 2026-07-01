import { TicTacToe } from '../../games/tic-tac-toe';

describe('TicTacToe Game Engine', () => {
  let game: TicTacToe;
  const player1 = 'player1';
  const player2 = 'player2';

  beforeEach(() => {
    game = new TicTacToe([player1, player2]);
  });

  describe('initGame', () => {
    it('should initialize a 3x3 empty board', () => {
      const state = game.getGameState();
      expect(state.board).toEqual([
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);
    });

    it('should set player1 as current player', () => {
      const state = game.getGameState();
      expect(state.currentPlayer).toBe(player1);
    });

    it('should set status to playing', () => {
      const state = game.getGameState();
      expect(state.status).toBe('playing');
    });

    it('should assign X to player1 and O to player2', () => {
      const state = game.getGameState();
      expect(state.metadata.symbols).toEqual({
        [player1]: 'X',
        [player2]: 'O',
      });
    });
  });

  describe('makeMove', () => {
    it('should place a marker on valid move', () => {
      const result = game.makeMove(player1, { row: 0, col: 0 });
      expect(result).toBe(true);
      const state = game.getGameState();
      expect((state.board as any)[0][0]).toBe('X');
    });

    it('should switch players after a valid move', () => {
      game.makeMove(player1, { row: 0, col: 0 });
      const state = game.getGameState();
      expect(state.currentPlayer).toBe(player2);
    });

    it('should reject move on occupied cell', () => {
      game.makeMove(player1, { row: 0, col: 0 });
      const result = game.makeMove(player2, { row: 0, col: 0 });
      expect(result).toBe(false);
    });

    it('should reject move from wrong player', () => {
      const result = game.makeMove(player2, { row: 0, col: 0 });
      expect(result).toBe(false);
    });

    it('should reject move with out-of-bounds coordinates', () => {
      const result = game.makeMove(player1, { row: 3, col: 0 });
      expect(result).toBe(false);
    });

    it('should reject move with negative coordinates', () => {
      const result = game.makeMove(player1, { row: -1, col: 0 });
      expect(result).toBe(false);
    });

    it('should record move in history', () => {
      game.makeMove(player1, { row: 1, col: 1 });
      const state = game.getGameState();
      expect(state.moveHistory).toHaveLength(1);
      expect(state.moveHistory[0].player).toBe(player1);
      expect(state.moveHistory[0].data).toEqual({ row: 1, col: 1, symbol: 'X' });
    });
  });

  describe('checkWin', () => {
    it('should detect row win', () => {
      game.makeMove(player1, { row: 0, col: 0 });
      game.makeMove(player2, { row: 1, col: 0 });
      game.makeMove(player1, { row: 0, col: 1 });
      game.makeMove(player2, { row: 1, col: 1 });
      game.makeMove(player1, { row: 0, col: 2 });

      const state = game.getGameState();
      expect(state.status).toBe('finished');
      expect(state.winner).toBe(player1);
    });

    it('should detect column win', () => {
      game.makeMove(player1, { row: 0, col: 0 });
      game.makeMove(player2, { row: 0, col: 1 });
      game.makeMove(player1, { row: 1, col: 0 });
      game.makeMove(player2, { row: 1, col: 1 });
      game.makeMove(player1, { row: 2, col: 0 });

      const state = game.getGameState();
      expect(state.status).toBe('finished');
      expect(state.winner).toBe(player1);
    });

    it('should detect diagonal win', () => {
      game.makeMove(player1, { row: 0, col: 0 });
      game.makeMove(player2, { row: 0, col: 1 });
      game.makeMove(player1, { row: 1, col: 1 });
      game.makeMove(player2, { row: 0, col: 2 });
      game.makeMove(player1, { row: 2, col: 2 });

      const state = game.getGameState();
      expect(state.status).toBe('finished');
      expect(state.winner).toBe(player1);
    });

    it('should detect anti-diagonal win', () => {
      game.makeMove(player1, { row: 0, col: 2 });
      game.makeMove(player2, { row: 0, col: 0 });
      game.makeMove(player1, { row: 1, col: 1 });
      game.makeMove(player2, { row: 1, col: 0 });
      game.makeMove(player1, { row: 2, col: 0 });

      const state = game.getGameState();
      expect(state.status).toBe('finished');
      expect(state.winner).toBe(player1);
    });

    it('should detect player2 win', () => {
      game.makeMove(player1, { row: 0, col: 0 });
      game.makeMove(player2, { row: 1, col: 0 });
      game.makeMove(player1, { row: 0, col: 1 });
      game.makeMove(player2, { row: 1, col: 1 });
      game.makeMove(player1, { row: 2, col: 2 });
      game.makeMove(player2, { row: 1, col: 2 });

      const state = game.getGameState();
      expect(state.status).toBe('finished');
      expect(state.winner).toBe(player2);
    });
  });

  describe('checkDraw', () => {
    it('should detect draw when board is full with no winner', () => {
      // X O X
      // X X O
      // O X O
      game.makeMove(player1, { row: 0, col: 0 }); // X
      game.makeMove(player2, { row: 0, col: 1 }); // O
      game.makeMove(player1, { row: 0, col: 2 }); // X
      game.makeMove(player2, { row: 1, col: 2 }); // O
      game.makeMove(player1, { row: 1, col: 0 }); // X
      game.makeMove(player2, { row: 2, col: 0 }); // O
      game.makeMove(player1, { row: 1, col: 1 }); // X
      game.makeMove(player2, { row: 2, col: 2 }); // O
      game.makeMove(player1, { row: 2, col: 1 }); // X

      const state = game.getGameState();
      expect(state.status).toBe('draw');
      expect(state.winner).toBeNull();
    });
  });

  describe('getValidMoves', () => {
    it('should return all cells when board is empty', () => {
      const moves = game.getValidMoves(player1);
      expect(moves).toHaveLength(9);
    });

    it('should exclude occupied cells', () => {
      game.makeMove(player1, { row: 0, col: 0 });
      game.makeMove(player2, { row: 1, col: 1 });
      const moves = game.getValidMoves(player1);
      expect(moves).toHaveLength(7);
      expect(moves).not.toContainEqual({ row: 0, col: 0 });
      expect(moves).not.toContainEqual({ row: 1, col: 1 });
    });

    it('should return empty array when game is over', () => {
      game.makeMove(player1, { row: 0, col: 0 });
      game.makeMove(player2, { row: 1, col: 0 });
      game.makeMove(player1, { row: 0, col: 1 });
      game.makeMove(player2, { row: 1, col: 1 });
      game.makeMove(player1, { row: 0, col: 2 }); // win

      expect(game.isGameOver()).toBe(true);
    });
  });

  describe('isGameOver', () => {
    it('should return false during active game', () => {
      expect(game.isGameOver()).toBe(false);
    });

    it('should return true after a win', () => {
      game.makeMove(player1, { row: 0, col: 0 });
      game.makeMove(player2, { row: 1, col: 0 });
      game.makeMove(player1, { row: 0, col: 1 });
      game.makeMove(player2, { row: 1, col: 1 });
      game.makeMove(player1, { row: 0, col: 2 });
      expect(game.isGameOver()).toBe(true);
    });

    it('should reject moves after game over', () => {
      game.makeMove(player1, { row: 0, col: 0 });
      game.makeMove(player2, { row: 1, col: 0 });
      game.makeMove(player1, { row: 0, col: 1 });
      game.makeMove(player2, { row: 1, col: 1 });
      game.makeMove(player1, { row: 0, col: 2 }); // win

      const result = game.makeMove(player2, { row: 2, col: 0 });
      expect(result).toBe(false);
    });
  });
});
