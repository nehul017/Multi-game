'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

interface SpectatorBarProps {
  spectators: Array<{ id: string; username: string; avatar?: string }>;
  className?: string;
}

export function SpectatorBar({ spectators, className }: SpectatorBarProps) {
  const reduce = useReducedMotion();
  const visible = spectators.slice(0, 6);
  const extra = Math.max(0, spectators.length - visible.length);

  return (
    <div
      className={cn(
        'ludo-glass flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-theme',
        className
      )}
      aria-label={`${spectators.length} spectators watching`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 border border-primary-500/20 shrink-0">
        <Eye className="w-4 h-4 text-primary-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-theme-primary tracking-tight">
          {spectators.length} Spectator{spectators.length !== 1 ? 's' : ''}
        </p>
        <p className="text-[11px] text-theme-muted">Live audience</p>
      </div>
      <div className="flex items-center -space-x-2">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((s) => (
            <motion.div
              key={s.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, scale: 0.6, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.6, y: -6 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            >
              <Tooltip content={s.username}>
                <span className="inline-flex ring-2 ring-[var(--bg-card)] rounded-full">
                  <Avatar name={s.username} src={s.avatar} size="sm" />
                </span>
              </Tooltip>
            </motion.div>
          ))}
        </AnimatePresence>
        {extra > 0 && (
          <span className="w-8 h-8 rounded-full bg-theme-secondary flex items-center justify-center text-[10px] font-bold text-theme-muted border-2 border-[var(--bg-card)]">
            +{extra}
          </span>
        )}
      </div>
    </div>
  );
}
