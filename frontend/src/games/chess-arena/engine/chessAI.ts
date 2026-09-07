import { Chess } from 'chess.js';
import type { ChessDifficulty, ChessMoveInput, ChessPieceType } from '../types';
import { squareToPos } from './convert';

const PIECE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const PST: Record<string, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
  ],
};

const DEPTH: Record<ChessDifficulty, number> = {
  beginner: 1,
  easy: 1,
  medium: 2,
  hard: 2,
  expert: 3,
};

const SYMBOL_TYPE: Record<string, ChessPieceType> = {
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
};

function index(file: number, rank: number, white: boolean) {
  return white ? rank * 8 + file : (7 - rank) * 8 + file;
}

function evaluate(game: Chess) {
  if (game.isCheckmate()) return game.turn() === 'w' ? -100000 : 100000;
  if (game.isDraw()) return 0;
  const board = game.board();
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (!cell) continue;
      const white = cell.color === 'w';
      const table = PST[cell.type] || PST.p;
      const value = PIECE[cell.type] + table[index(c, r, white)];
      score += white ? value : -value;
    }
  }
  return score;
}

function search(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  deadline: number
): number {
  if (depth === 0 || game.isGameOver() || Date.now() > deadline) return evaluate(game);
  const moves = game.moves({ verbose: true }).sort((a, b) => Number(Boolean(b.captured)) - Number(Boolean(a.captured)));
  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      game.move(move);
      best = Math.max(best, search(game, depth - 1, alpha, beta, false, deadline));
      game.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const move of moves) {
    game.move(move);
    best = Math.min(best, search(game, depth - 1, alpha, beta, true, deadline));
    game.undo();
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

export function pickAiMove(fen: string, difficulty: ChessDifficulty): ChessMoveInput | null {
  const game = new Chess(fen);
  const legal = game.moves({ verbose: true });
  if (legal.length === 0) return null;

  if (difficulty === 'beginner') {
    const quiet = legal.filter((m) => !m.captured);
    const pool = quiet.length ? quiet : legal;
    const choice = pool[Math.floor(Math.random() * pool.length)];
    return {
      from: squareToPos(choice.from),
      to: squareToPos(choice.to),
      promotion: choice.promotion ? SYMBOL_TYPE[choice.promotion] : undefined,
    };
  }

  const depth = DEPTH[difficulty];
  const maximizing = game.turn() === 'w';
  let bestMove = legal[0];
  let bestScore = maximizing ? -Infinity : Infinity;
  const deadline = Date.now() + (difficulty === 'expert' ? 220 : 120);

  const ordered = [...legal].sort((a, b) => Number(Boolean(b.captured)) - Number(Boolean(a.captured)));
  for (const move of ordered) {
    if (Date.now() > deadline) break;
    game.move(move);
    const score = search(game, depth - 1, -Infinity, Infinity, !maximizing, deadline);
    game.undo();
    if (maximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  if (difficulty === 'easy' && Math.random() < 0.22) {
    bestMove = ordered[Math.min(2, ordered.length - 1)];
  }

  return {
    from: squareToPos(bestMove.from),
    to: squareToPos(bestMove.to),
    promotion: bestMove.promotion ? SYMBOL_TYPE[bestMove.promotion] : undefined,
  };
}

export function createChessAI() {
  return {
    pick: pickAiMove,
  };
}
