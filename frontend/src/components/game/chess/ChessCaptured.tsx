'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChessPieceIcon, type ChessPieceColor, type ChessPieceType } from './ChessPiece';
import { cn } from '@/lib/utils';

const START_COUNTS: Record<ChessPieceType, number> = {
  king: 1,
  queen: 1,
  rook: 2,
  bishop: 2,
  knight: 2,
  pawn: 8,
};

const ORDER: ChessPieceType[] = ['queen', 'rook', 'bishop', 'knight', 'pawn'];

type BoardPiece = { type: string; color: ChessPieceColor } | null;

function countOnBoard(board: unknown, color: ChessPieceColor): Record<ChessPieceType, number> {
  const counts: Record<ChessPieceType, number> = {
    king: 0,
    queen: 0,
    rook: 0,
    bishop: 0,
    knight: 0,
    pawn: 0,
  };
  if (!Array.isArray(board)) return counts;
  for (const row of board) {
    if (!Array.isArray(row)) continue;
    for (const cell of row as BoardPiece[]) {
      if (!cell || cell.color !== color) continue;
      const t = cell.type as ChessPieceType;
      if (t in counts) counts[t] += 1;
    }
  }
  return counts;
}

function getCaptured(board: unknown, color: ChessPieceColor): ChessPieceType[] {
  const onBoard = countOnBoard(board, color);
  const out: ChessPieceType[] = [];
  for (const type of ORDER) {
    const missing = Math.max(0, START_COUNTS[type] - onBoard[type]);
    for (let i = 0; i < missing; i++) out.push(type);
  }
  return out;
}

interface ChessCapturedProps {
  board?: unknown;
  /** Color of pieces that were captured (shown as material lost by that side) */
  color: ChessPieceColor;
  label?: string;
  className?: string;
}

export function ChessCaptured({ board, color, label, className }: ChessCapturedProps) {
  const captured = getCaptured(board, color);

  return (
    <div className={cn('chess-glass rounded-xl border border-theme px-3 py-2.5', className)}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-theme-muted">
          {label || (color === 'white' ? 'White captured' : 'Black captured')}
        </p>
        <span className="text-[11px] font-semibold text-theme-muted tabular-nums">
          {captured.length}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1 min-h-[28px]">
        <AnimatePresence initial={false}>
          {captured.length === 0 ? (
            <span className="text-xs text-theme-muted/70">—</span>
          ) : (
            captured.map((type, i) => (
              <motion.span
                key={`${color}-${type}-${i}`}
                initial={{ opacity: 0, scale: 0.5, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              >
                <ChessPieceIcon type={type} color={color} />
              </motion.span>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
