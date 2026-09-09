import { GameEngine } from './engine';

type Cell = 'R' | 'Y' | null;
type Board = Cell[][];

const ROWS = 6;
const COLS = 7;
const SEARCH_DEPTH = 4;

export const connectFourBotId = (roomId: string): string =>
  `bot:connect-four:${roomId.slice(0, 8)}`;

export function pickConnectFourBotMove(
  engine: GameEngine,
  playerId: string
): Record<string, unknown> | null {
  const legal = engine.getValidMoves(playerId);
  if (!legal.length) return null;

  const state = engine.getGameState();
  const board = cloneBoard(state.board as Board);
  const symbols = (state.metadata?.symbols || {}) as Record<string, Cell>;
  const botSymbol = symbols[playerId] || inferSymbol(state.players, playerId);
  const opponentId = state.players.find((id) => id !== playerId);
  const oppSymbol: Cell = (opponentId && symbols[opponentId]) || (botSymbol === 'R' ? 'Y' : 'R');

  const cols = legal
    .map((move) => move.col)
    .filter((col): col is number => typeof col === 'number');

  for (const col of cols) {
    const next = drop(board, col, botSymbol);
    if (next && hasConnectFour(next.board, next.row, col, botSymbol)) {
      return { col };
    }
  }

  for (const col of cols) {
    const next = drop(board, col, oppSymbol);
    if (next && hasConnectFour(next.board, next.row, col, oppSymbol)) {
      return { col };
    }
  }

  let bestCol = cols[0];
  let bestScore = -Infinity;

  for (const col of orderColumns(cols)) {
    const next = drop(board, col, botSymbol);
    if (!next) continue;

    const score = minimax(next.board, SEARCH_DEPTH - 1, false, -Infinity, Infinity, botSymbol, oppSymbol);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return { col: bestCol };
}

function inferSymbol(players: string[], playerId: string): Cell {
  return players[0] === playerId ? 'R' : 'Y';
}

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function drop(board: Board, col: number, symbol: Cell): { board: Board; row: number } | null {
  if (col < 0 || col >= COLS || board[0][col] !== null) return null;
  const next = cloneBoard(board);
  for (let row = ROWS - 1; row >= 0; row--) {
    if (next[row][col] === null) {
      next[row][col] = symbol;
      return { board: next, row };
    }
  }
  return null;
}

function validColumns(board: Board): number[] {
  const cols: number[] = [];
  for (let col = 0; col < COLS; col++) {
    if (board[0][col] === null) cols.push(col);
  }
  return cols;
}

function orderColumns(cols: number[]): number[] {
  const centerBias = [3, 2, 4, 1, 5, 0, 6];
  return [...cols].sort((a, b) => centerBias.indexOf(a) - centerBias.indexOf(b));
}

function hasConnectFour(board: Board, row: number, col: number, symbol: Cell): boolean {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    count += countRay(board, row, col, dr, dc, symbol);
    count += countRay(board, row, col, -dr, -dc, symbol);
    if (count >= 4) return true;
  }
  return false;
}

function countRay(board: Board, row: number, col: number, dr: number, dc: number, symbol: Cell): number {
  let count = 0;
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === symbol) {
    count++;
    r += dr;
    c += dc;
  }
  return count;
}

function isFull(board: Board): boolean {
  return board[0].every((cell) => cell !== null);
}

function minimax(
  board: Board,
  depth: number,
  maximizing: boolean,
  alpha: number,
  beta: number,
  botSymbol: Cell,
  oppSymbol: Cell
): number {
  const score = evaluateBoard(board, botSymbol, oppSymbol);
  if (depth === 0 || Math.abs(score) >= 9000 || isFull(board)) {
    return score;
  }

  const cols = orderColumns(validColumns(board));
  if (maximizing) {
    let best = -Infinity;
    for (const col of cols) {
      const next = drop(board, col, botSymbol);
      if (!next) continue;
      best = Math.max(best, minimax(next.board, depth - 1, false, alpha, beta, botSymbol, oppSymbol));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const col of cols) {
    const next = drop(board, col, oppSymbol);
    if (!next) continue;
    best = Math.min(best, minimax(next.board, depth - 1, true, alpha, beta, botSymbol, oppSymbol));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

function evaluateBoard(board: Board, botSymbol: Cell, oppSymbol: Cell): number {
  let score = 0;
  const windows = collectWindows(board);

  for (const window of windows) {
    score += scoreWindow(window, botSymbol, oppSymbol);
    score -= scoreWindow(window, oppSymbol, botSymbol);
  }

  for (let row = 0; row < ROWS; row++) {
    if (board[row][3] === botSymbol) score += 3;
    if (board[row][3] === oppSymbol) score -= 3;
  }

  return score;
}

function scoreWindow(window: Cell[], me: Cell, opp: Cell): number {
  const mine = window.filter((cell) => cell === me).length;
  const theirs = window.filter((cell) => cell === opp).length;
  const empty = window.filter((cell) => cell === null).length;

  if (mine === 4) return 10000;
  if (theirs === 4) return -10000;
  if (mine === 3 && empty === 1) return 80;
  if (mine === 2 && empty === 2) return 8;
  return 0;
}

function collectWindows(board: Board): Cell[][] {
  const windows: Cell[][] = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      windows.push([board[row][col], board[row][col + 1], board[row][col + 2], board[row][col + 3]]);
    }
  }

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row <= ROWS - 4; row++) {
      windows.push([board[row][col], board[row + 1][col], board[row + 2][col], board[row + 3][col]]);
    }
  }

  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      windows.push([
        board[row][col],
        board[row + 1][col + 1],
        board[row + 2][col + 2],
        board[row + 3][col + 3],
      ]);
    }
  }

  for (let row = 3; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      windows.push([
        board[row][col],
        board[row - 1][col + 1],
        board[row - 2][col + 2],
        board[row - 3][col + 3],
      ]);
    }
  }

  return windows;
}
