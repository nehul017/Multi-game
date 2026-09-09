import { GameEngine } from './engine';

type Cell = 'X' | 'O' | null;
type Board = Cell[][];

const WIN_LINES: Array<Array<[number, number]>> = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

const CORNERS: Array<[number, number]> = [
  [0, 0],
  [0, 2],
  [2, 0],
  [2, 2],
];

export const ticTacToeBotId = (roomId: string): string =>
  `bot:tic-tac-toe:${roomId.slice(0, 8)}`;

export function pickTicTacToeBotMove(
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
  const oppSymbol: Cell =
    (opponentId && symbols[opponentId]) || (botSymbol === 'X' ? 'O' : 'X');

  const cells = legal.filter(
    (move): move is { row: number; col: number } =>
      typeof move.row === 'number' && typeof move.col === 'number'
  );

  for (const move of cells) {
    if (hasWin(place(board, move.row, move.col, botSymbol), botSymbol)) {
      return { row: move.row, col: move.col };
    }
  }

  for (const move of cells) {
    if (hasWin(place(board, move.row, move.col, oppSymbol), oppSymbol)) {
      return { row: move.row, col: move.col };
    }
  }

  if (board[1][1] === null) return { row: 1, col: 1 };

  for (const [row, col] of CORNERS) {
    if (board[row][col] === null) return { row, col };
  }

  const fallback = cells[0] || legal[0];
  return fallback ? { row: fallback.row, col: fallback.col } : null;
}

function inferSymbol(players: string[], playerId: string): Cell {
  return players[0] === playerId ? 'X' : 'O';
}

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function place(board: Board, row: number, col: number, symbol: Cell): Board {
  const next = cloneBoard(board);
  next[row][col] = symbol;
  return next;
}

function hasWin(board: Board, symbol: Cell): boolean {
  return WIN_LINES.some((line) => line.every(([row, col]) => board[row][col] === symbol));
}
