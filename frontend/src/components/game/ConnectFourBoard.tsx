'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ConnectFourBoardProps {
  onGameEnd?: (winner: string | null) => void;
  onMove?: (position: { row: number; col: number } | number) => void;
  board?: unknown;
  disabled?: boolean;
  isMyTurn?: boolean;
}

type Cell = 'red' | 'yellow' | null;
const ROWS = 6;
const COLS = 7;

function normalizeBoard(board: unknown): Cell[][] {
  const empty = Array.from({ length: ROWS }, () => Array(COLS).fill(null) as Cell[]);
  if (!Array.isArray(board) || board.length !== ROWS) return empty;

  return (board as unknown[][]).map((row) =>
    row.map((cell) => {
      if (cell === 'R' || cell === 'red') return 'red';
      if (cell === 'Y' || cell === 'yellow') return 'yellow';
      return null;
    })
  );
}

function findWinningCells(board: Cell[][]): Set<string> {
  const wins = new Set<string>();
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ] as const;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      if (!cell) continue;

      for (const [dr, dc] of dirs) {
        const line: Array<[number, number]> = [[r, c]];
        for (let i = 1; i < 4; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
          if (board[nr][nc] !== cell) break;
          line.push([nr, nc]);
        }
        if (line.length === 4) {
          line.forEach(([wr, wc]) => wins.add(`${wr}-${wc}`));
        }
      }
    }
  }

  return wins;
}

function nextDiscColor(board: Cell[][]): Cell {
  let red = 0;
  let yellow = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === 'red') red++;
      if (cell === 'yellow') yellow++;
    }
  }
  return red <= yellow ? 'red' : 'yellow';
}

function Disc({
  color,
  size = 'full',
  ghost = false,
  winning = false,
  animateDrop = false,
  dropFrom = 0,
}: {
  color: 'red' | 'yellow';
  size?: 'full' | 'preview';
  ghost?: boolean;
  winning?: boolean;
  animateDrop?: boolean;
  dropFrom?: number;
}) {
  return (
    <motion.div
      initial={
        animateDrop
          ? { y: -((dropFrom + 1) * 56 + 28), scale: 0.92, opacity: 0.9 }
          : ghost
            ? { y: -10, opacity: 0, scale: 0.85 }
            : false
      }
      animate={
        winning
          ? { y: 0, scale: [1, 1.1, 1], opacity: ghost ? 0.42 : 1 }
          : { y: 0, scale: 1, opacity: ghost ? 0.42 : 1 }
      }
      exit={{ opacity: 0, scale: 0.8, y: -6 }}
      transition={
        animateDrop
          ? {
              y: { type: 'spring', stiffness: 380, damping: 16, mass: 0.9 },
              opacity: { duration: 0.1 },
              scale: { type: 'spring', stiffness: 280, damping: 14 },
            }
          : winning
            ? { scale: { repeat: Infinity, duration: 0.9, ease: 'easeInOut' } }
            : { type: 'spring', stiffness: 380, damping: 22 }
      }
      className={cn(
        'c4-disc relative rounded-full',
        size === 'full' ? 'w-full h-full' : 'w-[72%] h-[72%]',
        color === 'red' ? 'c4-disc-red' : 'c4-disc-yellow',
        ghost && 'c4-disc-ghost',
        winning && 'c4-disc-win'
      )}
    >
      <span className="c4-disc-shine" />
      <span className="c4-disc-rim" />
    </motion.div>
  );
}

export function ConnectFourBoard({
  onMove,
  board: externalBoard,
  disabled,
  isMyTurn,
}: ConnectFourBoardProps) {
  const board = useMemo(() => normalizeBoard(externalBoard), [externalBoard]);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [shake, setShake] = useState(false);
  const prevBoardRef = useRef<Cell[][] | null>(null);

  const lastDrop = useMemo(() => {
    const prev = prevBoardRef.current;
    if (!prev) return null;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!prev[r][c] && board[r][c]) return { row: r, col: c };
      }
    }
    return null;
  }, [board]);

  const winningCells = useMemo(() => findWinningCells(board), [board]);
  const previewColor = nextDiscColor(board);
  const canPlay = !disabled && winningCells.size === 0;
  const winnerColor =
    winningCells.size > 0
      ? (() => {
          const [key] = winningCells;
          const [r, c] = key.split('-').map(Number);
          return board[r]?.[c] ?? null;
        })()
      : null;

  useEffect(() => {
    prevBoardRef.current = board;
    if (!lastDrop) return;
    setShake(true);
    const t = window.setTimeout(() => setShake(false), 280);
    return () => window.clearTimeout(t);
  }, [board, lastDrop]);

  const dropDisc = (col: number) => {
    if (!canPlay || board[0][col] !== null) return;
    onMove?.(col);
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 w-full max-w-[min(100%,420px)] mx-auto select-none relative z-[1]">
      <div className="h-9 flex flex-col items-center justify-center gap-1">
        <AnimatePresence mode="wait">
          {winningCells.size > 0 ? (
            <motion.p
              key="win"
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                'font-display text-lg sm:text-xl font-bold tracking-wide uppercase',
                winnerColor === 'yellow'
                  ? 'text-cyan-400 c4-status-glow-cyan'
                  : 'text-primary-400 c4-status-glow'
              )}
            >
              Connect Four!
            </motion.p>
          ) : isMyTurn === false ? (
            <motion.p
              key="opp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-theme-muted"
            >
              Opponent&apos;s turn...
            </motion.p>
          ) : isMyTurn ? (
            <motion.div
              key="you"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <span
                className={cn(
                  'c4-legend-dot',
                  previewColor === 'red' ? 'c4-legend-dot-p1' : 'c4-legend-dot-p2'
                )}
              />
              <span className="text-sm font-semibold text-theme-success">Your turn — tap a column</span>
            </motion.div>
          ) : (
            <motion.p
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-theme-muted"
            >
              Connect Four
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="c4-legend">
        <span className="c4-legend-item">
          <span className="c4-legend-dot c4-legend-dot-p1" />
          Purple
        </span>
        <span className="c4-legend-item">
          <span className="c4-legend-dot c4-legend-dot-p2" />
          Cyan
        </span>
      </div>

      <motion.div
        animate={shake ? { x: [0, -4, 4, -3, 3, 0], y: [0, 2, 0] } : { x: 0, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="c4-stage relative w-full"
      >
        <div className="c4-table-glow pointer-events-none absolute inset-x-[8%] bottom-0 h-[18%] rounded-[50%] blur-2xl" />

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 px-3 sm:px-4 mb-1.5 h-10 sm:h-12">
          {Array.from({ length: COLS }).map((_, col) => {
            const full = board[0][col] !== null;
            const showPreview = canPlay && hoverCol === col && !full;
            return (
              <button
                key={col}
                type="button"
                aria-label={`Drop in column ${col + 1}`}
                onMouseEnter={() => setHoverCol(col)}
                onMouseLeave={() => setHoverCol(null)}
                onFocus={() => setHoverCol(col)}
                onBlur={() => setHoverCol(null)}
                onClick={() => dropDisc(col)}
                disabled={!canPlay || full}
                className="relative flex items-end justify-center outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 rounded-full"
              >
                <AnimatePresence>
                  {showPreview && previewColor && (
                    <motion.div
                      key="preview"
                      className="absolute bottom-0 flex items-center justify-center w-full aspect-square"
                    >
                      <Disc color={previewColor} size="preview" ghost />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        <div className="c4-frame relative mx-auto">
          <div className="c4-frame-bevel" />
          <div className="c4-frame-face relative z-[1] p-2.5 sm:p-3.5">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {Array.from({ length: COLS }).map((_, col) => {
                const highlighted = canPlay && hoverCol === col && board[0][col] === null;
                return (
                  <button
                    key={col}
                    type="button"
                    aria-label={`Column ${col + 1}`}
                    onMouseEnter={() => setHoverCol(col)}
                    onMouseLeave={() => setHoverCol(null)}
                    onClick={() => dropDisc(col)}
                    disabled={!canPlay || board[0][col] !== null}
                    className={cn(
                      'c4-column relative flex flex-col gap-1.5 sm:gap-2 rounded-xl outline-none transition-all duration-200',
                      'focus-visible:ring-2 focus-visible:ring-white/40',
                      highlighted && 'c4-column-hot',
                      canPlay && board[0][col] === null && 'cursor-pointer'
                    )}
                  >
                    {Array.from({ length: ROWS }).map((_, row) => {
                      const cell = board[row][col];
                      const isWin = winningCells.has(`${row}-${col}`);
                      const isLast =
                        lastDrop?.row === row && lastDrop?.col === col && Boolean(cell);

                      return (
                        <div key={row} className="c4-slot relative aspect-square w-full">
                          <div className="c4-hole absolute inset-0 rounded-full" />
                          {cell && (
                            <div className="absolute inset-[9%] z-[1]">
                              <Disc
                                key={`${row}-${col}-${cell}`}
                                color={cell}
                                winning={isWin}
                                animateDrop={isLast}
                                dropFrom={row}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="c4-legs pointer-events-none" aria-hidden>
            <span />
            <span />
          </div>
          <div className="c4-base" aria-hidden />
        </div>
      </motion.div>
    </div>
  );
}
