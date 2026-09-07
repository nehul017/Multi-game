'use client';

import { memo, useMemo } from 'react';
import { cellsOf, COLS, ghostPiece, ROWS } from '../logic';
import type { ActivePiece, PieceType } from '../types';
import { cn } from '@/lib/utils';

interface GameBoardProps {
  board: (PieceType | null)[][];
  active: ActivePiece | null;
  clearingRows: number[];
  spawnTick: number;
  dropTick: number;
}

type CellKind = 'empty' | 'locked' | 'active' | 'ghost';

interface RenderCell {
  kind: CellKind;
  type: PieceType | null;
  clearing: boolean;
}

function buildCells(
  board: (PieceType | null)[][],
  active: ActivePiece | null,
  clearingRows: number[]
): RenderCell[][] {
  const clearing = new Set(clearingRows);
  const cells: RenderCell[][] = board.map((row, y) =>
    row.map((type) => ({
      kind: type ? 'locked' : 'empty',
      type,
      clearing: clearing.has(y),
    }))
  );

  if (!active) return cells;

  const ghost = ghostPiece(board, active);
  for (const { x, y } of cellsOf(ghost)) {
    if (y < 0 || y >= ROWS || x < 0 || x >= COLS) continue;
    if (cells[y][x].kind === 'empty') {
      cells[y][x] = { kind: 'ghost', type: active.type, clearing: false };
    }
  }

  for (const { x, y } of cellsOf(active)) {
    if (y < 0 || y >= ROWS || x < 0 || x >= COLS) continue;
    cells[y][x] = { kind: 'active', type: active.type, clearing: false };
  }

  return cells;
}

export const GameBoard = memo(function GameBoard({
  board,
  active,
  clearingRows,
  spawnTick,
  dropTick,
}: GameBoardProps) {
  const cells = useMemo(
    () => buildCells(board, active, clearingRows),
    [board, active, clearingRows]
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
              key={`${y}-${x}-${cell.kind}-${cell.type ?? 'e'}-${cell.kind === 'active' ? spawnTick : 0}`}
              role="gridcell"
              aria-colindex={x + 1}
              aria-rowindex={y + 1}
              className={cn(
                'bm-cell',
                cell.kind === 'active' && 'bm-cell-active',
                cell.kind === 'ghost' && 'bm-cell-ghost',
                cell.kind === 'locked' && 'bm-cell-locked',
                cell.clearing && 'bm-cell-clear'
              )}
              data-type={cell.type ?? undefined}
            />
          ))
        )}
      </div>
    </div>
  );
});
