'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { fruitSlotsAudio } from '../audio';
import { SlotSymbol } from './SlotSymbol';
import type { SymbolId } from '../types';

const CYCLE: SymbolId[] = ['cherry', 'lemon', 'orange', 'grapes', 'watermelon', 'bell', 'seven'];
const SPIN_STRIP: SymbolId[] = Array.from({ length: 21 }, (_, index) => CYCLE[index % CYCLE.length]);
const MIN_SPIN_MS = 720;

interface ReelProps {
  column: SymbolId[];
  spinning: boolean;
  resultColumn?: SymbolId[];
  stopDelayMs: number;
  winningRows: number[];
  showWin: boolean;
  onStopped: () => void;
}

export function Reel({
  column,
  spinning,
  resultColumn,
  stopDelayMs,
  winningRows,
  showWin,
  onStopped,
}: ReelProps) {
  const [display, setDisplay] = useState<SymbolId[]>(column);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'landed'>('idle');
  const landed = useRef(false);
  const notified = useRef(false);
  const spinStartedAt = useRef(0);

  useEffect(() => {
    if (!spinning) {
      landed.current = false;
      notified.current = false;
      setPhase('idle');
      setDisplay(column);
    }
  }, [column, spinning]);

  useEffect(() => {
    if (!spinning || landed.current) return;
    spinStartedAt.current = Date.now();
    setPhase('spinning');
  }, [spinning]);

  useEffect(() => {
    if (!spinning || !resultColumn || landed.current) return undefined;
    const wait = Math.max(0, MIN_SPIN_MS - (Date.now() - spinStartedAt.current)) + stopDelayMs;
    const timer = window.setTimeout(() => {
      landed.current = true;
      setDisplay(resultColumn);
      setPhase('landed');
      fruitSlotsAudio.play('stop');
      if (!notified.current) {
        notified.current = true;
        onStopped();
      }
    }, wait);
    return () => window.clearTimeout(timer);
  }, [spinning, resultColumn, stopDelayMs, onStopped]);

  const symbols = phase === 'spinning' ? SPIN_STRIP : display;

  return (
    <div
      className={cn('cfs-reel', phase === 'spinning' && 'is-spinning', phase === 'landed' && 'is-landed')}
      style={{ '--cfs-spin-ms': `${78 + (stopDelayMs % 7) * 4}ms` } as CSSProperties}
    >
      <div className="cfs-reel-track">
        {symbols.map((symbol, row) => (
          <div key={`${phase}-${row}`} className="cfs-cell">
            <SlotSymbol
              type={symbol}
              winning={showWin && winningRows.includes(row)}
              dimmed={showWin && winningRows.length > 0 && !winningRows.includes(row)}
            />
          </div>
        ))}
      </div>
      <div className="cfs-reel-shade cfs-reel-shade-top" />
      <div className="cfs-reel-shade cfs-reel-shade-bottom" />
    </div>
  );
}
