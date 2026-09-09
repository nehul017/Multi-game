'use client';

import { tileMask } from '../rooms';
import type { GridPos, PuzzleTile } from '../types';
import { N, E, S, W } from '../types';

interface PuzzleBoardProps {
  tiles: PuzzleTile[];
  cols: number;
  rows: number;
  lit: string[];
  selected: GridPos | null;
  disabled?: boolean;
  onRotate: (x: number, y: number) => void;
}

function has(mask: number, bit: number): boolean {
  return (mask & bit) !== 0;
}

export function PuzzleBoard({ tiles, cols, rows, lit, selected, disabled, onRotate }: PuzzleBoardProps) {
  const litSet = new Set(lit);

  return (
    <div
      className="pw-board"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      role="grid"
      aria-label="Puzzle room"
    >
      {Array.from({ length: rows * cols }, (_, index) => {
        const x = index % cols;
        const y = Math.floor(index / cols);
        const tile = tiles.find((item) => item.x === x && item.y === y);
        if (!tile || tile.role === 'empty') {
          return <div key={`${x}-${y}`} className="pw-tile is-empty" role="gridcell" />;
        }

        const mask = tileMask(tile);
        const isLit = litSet.has(`${x},${y}`);
        const isSelected = selected?.x === x && selected?.y === y;
        const clickable = !disabled && !tile.locked;

        return (
          <button
            key={`${x}-${y}`}
            type="button"
            role="gridcell"
            className={`pw-tile is-${tile.role}${isLit ? ' is-lit' : ''}${isSelected ? ' is-selected' : ''}${tile.locked ? ' is-locked' : ''}`}
            onClick={() => clickable && onRotate(x, y)}
            disabled={!clickable}
            aria-label={
              tile.role === 'start'
                ? 'Entrance'
                : tile.role === 'goal'
                  ? 'Exit'
                  : `Rotate path tile ${x + 1}, ${y + 1}`
            }
          >
            <span className="pw-tile-floor" />
            {has(mask, N) && <span className="pw-arm n" />}
            {has(mask, E) && <span className="pw-arm e" />}
            {has(mask, S) && <span className="pw-arm s" />}
            {has(mask, W) && <span className="pw-arm w" />}
            <span className="pw-hub" />
            {tile.role === 'start' && <span className="pw-mark pw-mark-start">IN</span>}
            {tile.role === 'goal' && <span className="pw-mark pw-mark-goal">OUT</span>}
            {tile.gem && <span className="pw-gem" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
