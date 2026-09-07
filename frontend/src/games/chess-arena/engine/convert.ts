import { Chess, type PieceSymbol, type Square } from 'chess.js';
import type { ChessBoardPiece, ChessColor, ChessGrid, ChessPieceType, ChessPos } from '../types';

const FILES = 'abcdefgh';
const TYPE_FROM_SYMBOL: Record<PieceSymbol, ChessPieceType> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};
const SYMBOL_FROM_TYPE: Record<ChessPieceType, PieceSymbol> = {
  pawn: 'p',
  knight: 'n',
  bishop: 'b',
  rook: 'r',
  queen: 'q',
  king: 'k',
};

export function posToSquare(pos: ChessPos): Square {
  return `${FILES[pos.col]}${8 - pos.row}` as Square;
}

export function squareToPos(square: string): ChessPos {
  return { col: FILES.indexOf(square[0]), row: 8 - Number(square[1]) };
}

export function chessJsToGrid(game: Chess): ChessGrid {
  const raw = game.board();
  return raw.map((rank) =>
    rank.map((cell) => {
      if (!cell) return null;
      return {
        type: TYPE_FROM_SYMBOL[cell.type],
        color: cell.color === 'w' ? 'white' : 'black',
      };
    })
  );
}

export function serverBoardToGrid(board: unknown): ChessGrid | null {
  if (!Array.isArray(board) || board.length !== 8) return null;
  return board.map((row) => {
    if (!Array.isArray(row)) return Array(8).fill(null);
    return row.map((cell) => {
      if (!cell || typeof cell !== 'object') return null;
      const piece = cell as { type?: string; color?: string; hasMoved?: boolean };
      const type = piece.type as ChessPieceType;
      const color = piece.color as ChessColor;
      if (!TYPE_FROM_SYMBOL[SYMBOL_FROM_TYPE[type]] || (color !== 'white' && color !== 'black')) {
        return null;
      }
      return { type, color, hasMoved: piece.hasMoved };
    });
  });
}

export function gridToFen(board: ChessGrid, turn: ChessColor): string {
  const game = new Chess();
  const empty = '8/8/8/8/8/8/8/8 w - - 0 1';
  game.load(empty);
  const map: Record<string, { type: PieceSymbol; color: 'w' | 'b' }> = {};
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r]?.[c];
      if (!piece) continue;
      map[posToSquare({ row: r, col: c })] = {
        type: SYMBOL_FROM_TYPE[piece.type],
        color: piece.color === 'white' ? 'w' : 'b',
      };
    }
  }
  const fenRanks = Array.from({ length: 8 }, (_, r) => {
    let run = 0;
    let out = '';
    for (let c = 0; c < 8; c++) {
      const sq = posToSquare({ row: r, col: c });
      const piece = map[sq];
      if (!piece) {
        run += 1;
        continue;
      }
      if (run) out += String(run);
      run = 0;
      const letter = piece.type === 'p' ? 'p' : piece.type;
      out += piece.color === 'w' ? letter.toUpperCase() : letter;
    }
    if (run) out += String(run);
    return out;
  });
  return `${fenRanks.join('/')} ${turn === 'white' ? 'w' : 'b'} - - 0 1`;
}

export function emptyGrid(): ChessGrid {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

export function startingGrid(): ChessGrid {
  return chessJsToGrid(new Chess());
}
