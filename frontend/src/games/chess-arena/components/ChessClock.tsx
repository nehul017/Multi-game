'use client';

import { cn } from '@/lib/utils';

interface ChessClockProps {
  seconds: number;
  active?: boolean;
  className?: string;
  compact?: boolean;
}

function formatClock(seconds: number) {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  const tenths = Math.floor((safe % 1) * 10);
  if (safe < 10) return `${m}:${s.toString().padStart(2, '0')}.${tenths}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ChessClock({ seconds, active, className, compact }: ChessClockProps) {
  const low = seconds <= 30;
  const critical = seconds <= 10;
  const timeout = seconds <= 0;

  return (
    <div
      role="timer"
      aria-label={`Clock ${formatClock(seconds)}`}
      className={cn(
        'cx-clock font-mono tabular-nums tracking-tight',
        compact ? 'text-lg sm:text-xl px-3 py-1.5' : 'text-2xl sm:text-3xl px-4 py-2',
        active && 'is-active',
        low && active && !critical && 'is-low',
        critical && active && 'is-critical',
        timeout && 'is-timeout',
        className
      )}
    >
      {formatClock(seconds)}
    </div>
  );
}
