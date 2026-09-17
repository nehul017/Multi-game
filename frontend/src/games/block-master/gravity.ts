import type { CellPos, GravityMove, PieceType } from './types';

export const GRAVITY_ANIM_MS = 240;
export const MAX_CASCADES = 20;

export interface ColumnCompressResult {
  packed: (PieceType | null)[];
  moves: Array<{ fromY: number; toY: number; type: PieceType }>;
}

export interface GravityResult {
  board: (PieceType | null)[][];
  moves: GravityMove[];
  affectedColumns: number[];
}

export interface CascadeWave {
  clearedRows: number[];
  moves: GravityMove[];
}

export interface CascadeResult {
  board: (PieceType | null)[][];
  waves: CascadeWave[];
}

function cloneBoard(board: (PieceType | null)[][]): (PieceType | null)[][] {
  return board.map((row) => row.slice());
}

function columnCount(board: (PieceType | null)[][]): number {
  return board[0]?.length ?? 0;
}

function uniqueColumns(board: (PieceType | null)[][], columns?: number[]): number[] {
  const width = columnCount(board);
  const source = columns ?? Array.from({ length: width }, (_, index) => index);
  return Array.from(new Set(source)).filter((x) => x >= 0 && x < width).sort((a, b) => a - b);
}

export function detectEmptySpaces(
  board: (PieceType | null)[][],
  columns?: number[]
): CellPos[] {
  const gaps: CellPos[] = [];
  for (const x of uniqueColumns(board, columns)) {
    let seenBlock = false;
    for (let y = 0; y < board.length; y += 1) {
      if (board[y][x]) {
        seenBlock = true;
      } else if (seenBlock) {
        gaps.push({ x, y });
      }
    }
  }
  return gaps;
}

export function compressColumn(column: (PieceType | null)[]): ColumnCompressResult {
  const occupied: Array<{ y: number; type: PieceType }> = [];
  for (let y = 0; y < column.length; y += 1) {
    const type = column[y];
    if (type) occupied.push({ y, type });
  }

  const packed = Array<PieceType | null>(column.length).fill(null);
  const destStart = column.length - occupied.length;
  const moves: ColumnCompressResult['moves'] = [];

  occupied.forEach((block, index) => {
    const toY = destStart + index;
    packed[toY] = block.type;
    if (toY !== block.y) {
      moves.push({ fromY: block.y, toY, type: block.type });
    }
  });

  return { packed, moves };
}

export function applyGravity(
  board: (PieceType | null)[][],
  columns?: number[]
): GravityResult {
  const next = cloneBoard(board);
  const moves: GravityMove[] = [];
  const affectedColumns: number[] = [];

  for (const x of uniqueColumns(board, columns)) {
    const column = next.map((row) => row[x]);
    const compressed = compressColumn(column);
    if (compressed.moves.length === 0) continue;

    affectedColumns.push(x);
    for (let y = 0; y < next.length; y += 1) {
      next[y][x] = compressed.packed[y];
    }
    for (const move of compressed.moves) {
      moves.push({ x, fromY: move.fromY, toY: move.toY, type: move.type });
    }
  }

  return { board: next, moves, affectedColumns };
}

export function clearFilledRows(
  board: (PieceType | null)[][],
  rows: number[]
): (PieceType | null)[][] {
  if (rows.length === 0) return cloneBoard(board);
  const skip = new Set(rows);
  return board.map((row, y) => (skip.has(y) ? row.map(() => null) : row.slice()));
}

export function findFilledRows(board: (PieceType | null)[][]): number[] {
  const rows: number[] = [];
  for (let y = 0; y < board.length; y += 1) {
    if (board[y].length > 0 && board[y].every((cell) => cell !== null)) {
      rows.push(y);
    }
  }
  return rows;
}

export function collapseClearedRows(
  board: (PieceType | null)[][],
  clearedRows: number[]
): GravityResult {
  if (clearedRows.length === 0) {
    return { board: cloneBoard(board), moves: [], affectedColumns: [] };
  }

  const skip = new Set(clearedRows);
  const width = columnCount(board);
  const kept: number[] = [];
  for (let y = 0; y < board.length; y += 1) {
    if (!skip.has(y)) kept.push(y);
  }

  const pad = board.length - kept.length;
  const next = Array.from({ length: board.length }, () => Array<PieceType | null>(width).fill(null));
  const moves: GravityMove[] = [];
  const affected = new Set<number>();

  kept.forEach((fromY, index) => {
    const toY = pad + index;
    for (let x = 0; x < width; x += 1) {
      const type = board[fromY][x];
      next[toY][x] = type;
      if (type && toY !== fromY) {
        moves.push({ x, fromY, toY, type });
        affected.add(x);
      }
    }
  });

  return {
    board: next,
    moves,
    affectedColumns: Array.from(affected).sort((a, b) => a - b),
  };
}

export function resolveCascade(board: (PieceType | null)[][]): CascadeResult {
  let current = cloneBoard(board);
  const waves: CascadeWave[] = [];

  for (let i = 0; i < MAX_CASCADES; i += 1) {
    const clearedRows = findFilledRows(current);
    if (clearedRows.length === 0) break;

    const gravity = collapseClearedRows(current, clearedRows);
    current = gravity.board;
    waves.push({ clearedRows, moves: gravity.moves });
  }

  return { board: current, waves };
}
