'use client';

import { cn } from '@/lib/utils';

interface ChessTimerProps {
  seconds?: number;
  isActive?: boolean;
  className?: string;
  maxSeconds?: number;
}

function formatTime(seconds: number) {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ChessTimer({
  seconds = 300,
  isActive = false,
  className,
  maxSeconds = 300,
}: ChessTimerProps) {
  const low = seconds <= 30;
  const critical = seconds <= 10;
  const progress = Math.min(1, Math.max(0, seconds / maxSeconds));
  const size = 56;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);

  return (
    <div
      className={cn(
        'relative shrink-0 flex items-center justify-center',
        critical && isActive && 'ludo-timer-shake',
        low && isActive && !critical && 'animate-pulse',
        className
      )}
      style={{ width: size, height: size }}
      aria-label={`Time remaining ${formatTime(seconds)}`}
      role="timer"
    >
      <svg width={size} height={size} className="-rotate-90 absolute inset-0" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-theme-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn(
            'transition-[stroke-dashoffset] duration-1000 ease-linear',
            critical
              ? 'text-red-500'
              : low
                ? 'text-amber-500'
                : isActive
                  ? 'text-primary-500'
                  : 'text-theme-muted/50'
          )}
          style={{
            filter: isActive
              ? critical
                ? 'drop-shadow(0 0 6px rgba(239,68,68,0.7))'
                : low
                  ? 'drop-shadow(0 0 6px rgba(245,158,11,0.6))'
                  : 'drop-shadow(0 0 6px rgba(124,58,237,0.55))'
              : undefined,
          }}
        />
      </svg>
      <span
        className={cn(
          'relative z-[1] font-mono text-xs sm:text-sm font-semibold tabular-nums',
          critical && isActive && 'text-red-500',
          low && !critical && isActive && 'text-amber-500',
          !low && isActive && 'text-theme-primary',
          !isActive && 'text-theme-muted'
        )}
      >
        {formatTime(seconds)}
      </span>
    </div>
  );
}
