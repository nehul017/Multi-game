import { GameEngine } from './engine';

type Cell = 'X' | 'O' | null;
type Board = Cell[][];

const WIN_LINES = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

export class TicTacToe extends GameEngine {
  private symbols: Map<string, Cell>;

  constructor(players: string[]) {
    super(players);
    this.symbols = new Map([
      [players[0], 'X'],
      [players[1], 'O'],
    ]);
    this.initGame();
  }

  initGame(): void {
    this.state.board = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ] as Board;
    this.state.status = 'playing';
    this.state.currentPlayer = this.state.players[0];
    this.state.metadata = { symbols: Object.fromEntries(this.symbols) };
  }

  validateMove(player: string, move: Record<string, unknown>): boolean {
    if (this.isGameOver()) return false;
    if (player !== this.state.currentPlayer) return false;

    const row = move.row as number;
    const col = move.col as number;

    if (row < 0 || row > 2 || col < 0 || col > 2) return false;

    const board = this.state.board as Board;
    return board[row][col] === null;
  }

  makeMove(player: string, move: Record<string, unknown>): boolean {
    if (!this.validateMove(player, move)) return false;

    const row = move.row as number;
    const col = move.col as number;
    const board = this.state.board as Board;
    const symbol = this.symbols.get(player)!;

    board[row][col] = symbol;
    this.addMoveToHistory(player, 'place', { row, col, symbol });

    const winner = this.checkWin();
    if (winner) {
      this.endGame(winner);
    } else if (this.checkDraw()) {
      this.endGame(null);
    } else {
      this.switchPlayer();
    }

    return true;
  }

  checkWin(): string | null {
    const board = this.state.board as Board;

    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      const cellA = board[a[0]][a[1]];
      const cellB = board[b[0]][b[1]];
      const cellC = board[c[0]][c[1]];

      if (cellA && cellA === cellB && cellB === cellC) {
        for (const [playerId, symbol] of this.symbols) {
          if (symbol === cellA) return playerId;
        }
      }
    }

    return null;
  }

  checkDraw(): boolean {
    const board = this.state.board as Board;
    return board.every((row) => row.every((cell) => cell !== null));
  }

  getValidMoves(_player: string): Record<string, unknown>[] {
    const board = this.state.board as Board;
    const moves: Record<string, unknown>[] = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          moves.push({ row, col });
        }
      }
    }

    return moves;
  }
}
