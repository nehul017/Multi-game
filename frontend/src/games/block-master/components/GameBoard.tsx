'use client';

import { memo, useMemo, type CSSProperties } from 'react';
import { cellsOf, COLS, ghostPiece, ROWS } from '../logic';
import type { ActivePiece, GravityMove, PieceType } from '../types';
import { cn } from '@/lib/utils';

interface GameBoardProps {
  board: (PieceType | null)[][];
  active: ActivePiece | null;
  clearingRows: number[];
  falling?: GravityMove[];
  spawnTick: number;
  dropTick: number;
  gravityTick?: number;
}

type CellKind = 'empty' | 'locked' | 'active' | 'ghost' | 'falling';

interface RenderCell {
  kind: CellKind;
  type: PieceType | null;
  clearing: boolean;
  gap: boolean;
  fallRows: number;
}

function buildCells(
  board: (PieceType | null)[][],
  active: ActivePiece | null,
  clearingRows: number[],
  falling: GravityMove[]
): RenderCell[][] {
  const clearing = new Set(clearingRows);
  const fallingFrom = new Map<string, GravityMove>();
  const gaps = new Set<string>();

  for (const move of falling) {
    fallingFrom.set(`${move.x},${move.fromY}`, move);
    for (let y = move.fromY + 1; y <= move.toY; y += 1) {
      gaps.add(`${move.x},${y}`);
    }
  }

  const cells: RenderCell[][] = board.map((row, y) =>
    row.map((type, x) => {
      const fall = fallingFrom.get(`${x},${y}`);
      if (fall) {
        return {
          kind: 'falling' as const,
          type: fall.type,
          clearing: false,
          gap: false,
          fallRows: fall.toY - fall.fromY,
        };
      }
      return {
        kind: type ? 'locked' : 'empty',
        type,
        clearing: clearing.has(y),
        gap: !type && gaps.has(`${x},${y}`),
        fallRows: 0,
      };
    })
  );

  if (!active || falling.length > 0) return cells;

  const ghost = ghostPiece(board, active);
  for (const { x, y } of cellsOf(ghost)) {
    if (y < 0 || y >= ROWS || x < 0 || x >= COLS) continue;
    if (cells[y][x].kind === 'empty') {
      cells[y][x] = { kind: 'ghost', type: active.type, clearing: false, gap: false, fallRows: 0 };
    }
  }

  for (const { x, y } of cellsOf(active)) {
    if (y < 0 || y >= ROWS || x < 0 || x >= COLS) continue;
    cells[y][x] = { kind: 'active', type: active.type, clearing: false, gap: false, fallRows: 0 };
  }

  return cells;
}

export const GameBoard = memo(function GameBoard({
  board,
  active,
  clearingRows,
  falling = [],
  spawnTick,
  dropTick,
  gravityTick = 0,
}: GameBoardProps) {
  const cells = useMemo(
    () => buildCells(board, active, clearingRows, falling),
    [board, active, clearingRows, falling]
  );

  return (
    <div
      className={cn('bm-board', dropTick > 0 && 'bm-board-drop')}
      key={`drop-${dropTick}`}
      role="grid"
      aria-label="Block Master board"
      aria-rowcount={ROWS}
      aria-colcount={COLS}
    >
      <div className="bm-grid">
        {cells.flatMap((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${y}-${x}-${cell.kind}-${cell.type ?? 'e'}-${cell.kind === 'active' ? spawnTick : 0}-${cell.kind === 'falling' ? gravityTick : 0}`}
              role="gridcell"
              aria-colindex={x + 1}
              aria-rowindex={y + 1}
              className={cn(
                'bm-cell',
                cell.kind === 'empty' && 'bm-cell-empty',
                cell.kind === 'active' && 'bm-cell-active',
                cell.kind === 'ghost' && 'bm-cell-ghost',
                (cell.kind === 'locked' || cell.kind === 'falling') && 'bm-cell-locked',
                cell.kind === 'falling' && 'bm-cell-falling',
                cell.clearing && 'bm-cell-clear',
                cell.gap && 'bm-cell-gap'
              )}
              data-type={cell.type ?? undefined}
              style={
                cell.kind === 'falling'
                  ? ({ '--bm-fall-rows': cell.fallRows } as CSSProperties)
                  : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  );
});
