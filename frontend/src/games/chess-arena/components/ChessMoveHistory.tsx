'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { ChessSanMove } from '../types';

interface ChessMoveHistoryProps {
  moves: ChessSanMove[];
  activePly?: number;
  onSelectPly?: (ply: number) => void;
  pgn?: string;
  className?: string;
}

export function ChessMoveHistory({ moves, activePly, onSelectPly, pgn, className }: ChessMoveHistoryProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const highlight = activePly ?? moves.length - 1;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [moves.length, highlight]);

  const pairs: Array<{ n: number; white?: ChessSanMove; black?: ChessSanMove }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({ n: Math.floor(i / 2) + 1, white: moves[i], black: moves[i + 1] });
  }

  const copyPgn = async () => {
    if (!pgn) return;
    try {
      await navigator.clipboard.writeText(pgn);
    } catch {
      /* ignore */
    }
  };

  const downloadPgn = () => {
    if (!pgn) return;
    const blob = new Blob([pgn], { type: 'application/x-chess-pgn' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game.pgn';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('cx-panel flex flex-col min-h-0', className)}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-theme">
        <h3 className="text-sm font-semibold text-theme-primary">Moves</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={copyPgn} disabled={!pgn} aria-label="Copy PGN">
            Copy
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadPgn} disabled={!pgn} aria-label="Download PGN">
            PGN
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto max-h-56">
        {moves.length === 0 ? (
          <p className="text-xs text-theme-muted text-center py-8">No moves yet</p>
        ) : (
          pairs.map((pair, pairIdx) => (
            <div key={pair.n} className="grid grid-cols-[2rem_1fr_1fr] gap-1 px-3 py-1 text-xs">
              <span className="text-theme-muted tabular-nums">{pair.n}.</span>
              {[pair.white, pair.black].map((move, side) => {
                const ply = pairIdx * 2 + side;
                if (!move) return <span key={side} />;
                return (
                  <button
                    key={side}
                    type="button"
                    onClick={() => onSelectPly?.(ply)}
                    className={cn(
                      'text-left px-1.5 py-0.5 rounded-md truncate',
                      ply === highlight ? 'bg-primary-500/18 text-primary-600 ring-1 ring-primary-500/30' : 'text-theme-primary hover:bg-primary-500/8'
                    )}
                  >
                    {move.san}
                  </button>
                );
              })}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
