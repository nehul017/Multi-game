'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Flame, Zap, Bot } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { ChessTimer } from './chess/ChessTimer';
import { cn } from '@/lib/utils';

interface PlayerPanelProps {
  username: string;
  avatar?: string;
  elo: number | string;
  timeLeft: number;
  isActive: boolean;
  side: 'left' | 'right';
  maxSeconds?: number;
  className?: string;
  winStreak?: number;
  countryFlag?: string;
  showTurnBadge?: boolean;
  premium?: boolean;
  waiting?: boolean;
  isBot?: boolean;
  botEta?: number;
}

export function PlayerPanel({
  username,
  avatar,
  elo,
  timeLeft,
  isActive,
  side,
  maxSeconds = 300,
  className,
  winStreak,
  countryFlag,
  showTurnBadge = false,
  premium = false,
  waiting = false,
  isBot = false,
  botEta,
}: PlayerPanelProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      whileHover={premium && !reduce ? { y: -2 } : undefined}
      className={cn(
        'relative flex items-center gap-3 p-3 sm:p-4 rounded-2xl border border-theme transition-all duration-300 min-w-0 overflow-hidden',
        premium ? 'ludo-glass' : 'chess-glass',
        isActive &&
          (premium
            ? 'ring-2 ring-primary-400/60 shadow-[0_0_28px_rgba(124,58,237,0.28)]'
            : 'ring-1 ring-sky-400/50 shadow-[0_0_24px_rgba(56,189,248,0.18)]'),
        waiting && 'ttt-player-waiting',
        side === 'right' && 'flex-row-reverse',
        className
      )}
    >
      {isActive && premium && !reduce && <span className="pointer-events-none absolute inset-0 ludo-turn-sweep" />}

      <div className="relative shrink-0">
        <Avatar
          name={username}
          src={avatar}
          size={premium ? 'lg' : 'md'}
          online={isActive}
          floating={isActive}
        />
        {isActive && (
          <span className="absolute -inset-1 rounded-full border-2 border-primary-400/50 animate-pulse pointer-events-none" />
        )}
      </div>

      <div className={cn('flex-1 min-w-0 relative z-[1]', side === 'right' && 'text-right')}>
        <div className={cn('flex items-center gap-1.5 min-w-0', side === 'right' && 'justify-end')}>
          {countryFlag && <span className="text-sm leading-none">{countryFlag}</span>}
          <p className="text-sm sm:text-base font-semibold text-theme-primary truncate tracking-tight">
            {username}
          </p>
        </div>
        <p className="text-xs text-theme-muted font-medium">
          {waiting && typeof botEta === 'number' ? `Bot in ${botEta}s` : `${elo} ELO`}
        </p>
        <div className={cn('mt-1.5 flex flex-wrap items-center gap-1.5', side === 'right' && 'justify-end')}>
          {isBot && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-500/12 text-primary-500 border border-primary-500/25">
              <Bot className="w-3 h-3" />
              Bot
            </span>
          )}
          {typeof winStreak === 'number' && winStreak > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-500 border border-orange-500/25">
              <Flame className="w-3 h-3" />
              {winStreak} streak
            </span>
          )}
          {showTurnBadge && isActive && (
            <motion.span
              initial={reduce ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-500/15 text-primary-500 border border-primary-500/30"
            >
              <Zap className="w-3 h-3" />
              Your turn
            </motion.span>
          )}
        </div>
      </div>

      <ChessTimer seconds={timeLeft} isActive={isActive} maxSeconds={maxSeconds} />
    </motion.div>
  );
}
