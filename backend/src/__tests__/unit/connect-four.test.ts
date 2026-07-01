import { ConnectFour } from '../../games/connect-four';

describe('ConnectFour Game Engine', () => {
  let game: ConnectFour;
  const player1 = 'p1';
  const player2 = 'p2';

  beforeEach(() => {
    game = new ConnectFour([player1, player2]);
  });

  describe('initGame', () => {
    it('should initialize a 6x7 empty board', () => {
      const state = game.getGameState();
      const board = state.board as (string | null)[][];
      expect(board).toHaveLength(6);
      expect(board[0]).toHaveLength(7);
      board.forEach(row => row.forEach(cell => expect(cell).toBeNull()));
    });

    it('should start with player1', () => {
      expect(game.getCurrentPlayer()).toBe(player1);
    });
  });

  describe('makeMove', () => {
    it('should drop disc to bottom of column', () => {
      const result = game.makeMove(player1, { col: 0 });
      expect(result).toBe(true);
      const state = game.getGameState();
      const board = state.board as (string | null)[][];
      expect(board[5][0]).not.toBeNull();
    });

    it('should stack discs in same column', () => {
      game.makeMove(player1, { col: 0 });
      game.makeMove(player2, { col: 0 });
      const state = game.getGameState();
      const board = state.board as (string | null)[][];
      expect(board[5][0]).not.toBeNull();
      expect(board[4][0]).not.toBeNull();
    });

    it('should reject move on full column', () => {
      for (let i = 0; i < 6; i++) {
        game.makeMove(i % 2 === 0 ? player1 : player2, { col: 0 });
      }
      const result = game.makeMove(player1, { col: 0 });
      expect(result).toBe(false);
    });

    it('should reject invalid column', () => {
      expect(game.makeMove(player1, { col: 7 })).toBe(false);
      expect(game.makeMove(player1, { col: -1 })).toBe(false);
    });

    it('should switch players after valid move', () => {
      game.makeMove(player1, { col: 0 });
      expect(game.getCurrentPlayer()).toBe(player2);
    });
  });

  describe('checkWin', () => {
    it('should detect horizontal win', () => {
      // p1 plays cols 0-3, p2 plays row above
      game.makeMove(player1, { col: 0 });
      game.makeMove(player2, { col: 0 });
      game.makeMove(player1, { col: 1 });
      game.makeMove(player2, { col: 1 });
      game.makeMove(player1, { col: 2 });
      game.makeMove(player2, { col: 2 });
      game.makeMove(player1, { col: 3 });

      const state = game.getGameState();
      expect(state.status).toBe('finished');
      expect(state.winner).toBe(player1);
    });

    it('should detect vertical win', () => {
      game.makeMove(player1, { col: 0 });
      game.makeMove(player2, { col: 1 });
      game.makeMove(player1, { col: 0 });
      game.makeMove(player2, { col: 1 });
      game.makeMove(player1, { col: 0 });
      game.makeMove(player2, { col: 1 });
      game.makeMove(player1, { col: 0 });

      const state = game.getGameState();
      expect(state.status).toBe('finished');
      expect(state.winner).toBe(player1);
    });
  });

  describe('getValidMoves', () => {
    it('should return all 7 columns when board is empty', () => {
      const moves = game.getValidMoves(player1);
      expect(moves).toHaveLength(7);
    });
  });
});
