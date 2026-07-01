import { GameEngine } from './engine';

type Cell = 'R' | 'Y' | null;
type Board = Cell[][];

const ROWS = 6;
const COLS = 7;

export class ConnectFour extends GameEngine {
  private symbols: Map<string, Cell>;

  constructor(players: string[]) {
    super(players);
    this.symbols = new Map([
      [players[0], 'R'],
      [players[1], 'Y'],
    ]);
    this.initGame();
  }

  initGame(): void {
    const board: Board = [];
    for (let r = 0; r < ROWS; r++) {
      board.push(new Array(COLS).fill(null));
    }
    this.state.board = board;
    this.state.status = 'playing';
    this.state.currentPlayer = this.state.players[0];
    this.state.metadata = { rows: ROWS, cols: COLS, symbols: Object.fromEntries(this.symbols) };
  }

  validateMove(player: string, move: Record<string, unknown>): boolean {
    if (this.isGameOver()) return false;
    if (player !== this.state.currentPlayer) return false;

    const col = move.col as number;
    if (col < 0 || col >= COLS) return false;

    const board = this.state.board as Board;
    return board[0][col] === null;
  }

  makeMove(player: string, move: Record<string, unknown>): boolean {
    if (!this.validateMove(player, move)) return false;

    const col = move.col as number;
    const board = this.state.board as Board;
    const symbol = this.symbols.get(player)!;

    let landingRow = -1;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === null) {
        board[row][col] = symbol;
        landingRow = row;
        break;
      }
    }

    this.addMoveToHistory(player, 'drop', { col, row: landingRow, symbol });

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

    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = board[row][col];
        if (!cell) continue;

        for (const [dr, dc] of directions) {
          let count = 1;
          for (let i = 1; i < 4; i++) {
            const nr = row + dr * i;
            const nc = col + dc * i;
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
            if (board[nr][nc] !== cell) break;
            count++;
          }

          if (count >= 4) {
            for (const [playerId, symbol] of this.symbols) {
              if (symbol === cell) return playerId;
            }
          }
        }
      }
    }

    return null;
  }

  checkDraw(): boolean {
    const board = this.state.board as Board;
    return board[0].every((cell) => cell !== null);
  }

  getValidMoves(_player: string): Record<string, unknown>[] {
    const board = this.state.board as Board;
    const moves: Record<string, unknown>[] = [];

    for (let col = 0; col < COLS; col++) {
      if (board[0][col] === null) {
        moves.push({ col });
      }
    }

    return moves;
  }
}
