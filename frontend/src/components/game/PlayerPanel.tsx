'use client';

import { Clock } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface PlayerPanelProps {
  username: string;
  avatar?: string;
  elo: number;
  timeLeft: number;
  isActive: boolean;
  side: 'left' | 'right';
}

export function PlayerPanel({ username, avatar, elo, timeLeft, isActive, side }: PlayerPanelProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border transition-all',
      isActive ? 'bg-primary-500/10 border-primary-500/30' : 'bg-surface/50 border-surface-lighter/30',
      side === 'right' && 'flex-row-reverse'
    )}>
      <Avatar name={username} src={avatar} size="md" online={isActive} />
      <div className={cn('flex-1', side === 'right' && 'text-right')}>
        <p className="text-sm font-semibold text-white">{username}</p>
        <p className="text-xs text-gray-400">{elo} ELO</p>
      </div>
      <div className={cn(
        'flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono text-sm',
        isActive ? 'bg-primary-500/20 text-primary-300' : 'bg-surface-light text-gray-400'
      )}>
        <Clock className="w-3.5 h-3.5" />
        {formatTime(timeLeft)}
      </div>
    </div>
  );
}
