'use client';

import { useEffect, useRef } from 'react';
import { Move } from '@/types';
import { cn } from '@/lib/utils';

interface MoveHistoryProps {
  moves: Move[];
  className?: string;
  activeIndex?: number;
}

const FILES = 'abcdefgh';

function formatMoveLabel(move: Move): string {
  if (move.notation) return move.notation;
  const pos = move.position as
    | { from?: { row: number; col: number }; to?: { row: number; col: number } }
    | string
    | number
    | number[]
    | undefined;
  if (pos && typeof pos === 'object' && !Array.isArray(pos) && pos.from && pos.to) {
    const from = `${FILES[pos.from.col] ?? '?'}${8 - pos.from.row}`;
    const to = `${FILES[pos.to.col] ?? '?'}${8 - pos.to.row}`;
    return `${from}→${to}`;
  }
  return '—';
}

export function MoveHistory({ moves, className, activeIndex }: MoveHistoryProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const highlight = activeIndex ?? moves.length - 1;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [moves.length]);

  const pairs: Array<{ n: number; white?: Move; black?: Move }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      n: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div className={cn('chess-glass flex flex-col rounded-xl border border-theme overflow-hidden', className)}>
      <div className="px-3.5 py-2.5 border-b border-theme">
        <h4 className="text-sm font-semibold text-theme-primary tracking-tight">Move History</h4>
      </div>
      <div className="flex-1 overflow-y-auto max-h-48 sm:max-h-56">
        {moves.length === 0 ? (
          <p className="text-xs text-theme-muted text-center py-8">No moves yet</p>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {pairs.map((pair, pairIdx) => {
              const whiteIdx = pairIdx * 2;
              const blackIdx = pairIdx * 2 + 1;
              return (
                <div
                  key={pair.n}
                  className={cn(
                    'grid grid-cols-[2rem_1fr_1fr] gap-1 px-3 py-1.5 text-xs',
                    pairIdx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--border-subtle)]'
                  )}
                >
                  <span className="text-theme-muted font-medium tabular-nums">{pair.n}.</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-md font-medium truncate',
                      whiteIdx === highlight
                        ? 'bg-sky-500/20 text-sky-700 ring-1 ring-sky-400/40'
                        : 'text-theme-primary'
                    )}
                  >
                    {pair.white ? formatMoveLabel(pair.white) : '—'}
                  </span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-md font-medium truncate',
                      blackIdx === highlight
                        ? 'bg-sky-500/20 text-sky-700 ring-1 ring-sky-400/40'
                        : 'text-theme-primary'
                    )}
                  >
                    {pair.black ? formatMoveLabel(pair.black) : ''}
                  </span>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>
    </div>
  );
}
