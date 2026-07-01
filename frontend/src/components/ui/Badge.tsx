'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const variants = {
    default: 'bg-surface-lighter text-gray-300',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/30',
    purple: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: 'online' | 'offline' | 'in-game' | 'away' }) {
  const config = {
    online: { label: 'Online', variant: 'success' as const },
    offline: { label: 'Offline', variant: 'default' as const },
    'in-game': { label: 'In Game', variant: 'purple' as const },
    away: { label: 'Away', variant: 'warning' as const },
  };

  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function RankBadge({ rank }: { rank: string }) {
  const colors: Record<string, string> = {
    bronze: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    silver: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
    gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    platinum: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
    diamond: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
    master: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    grandmaster: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border', colors[rank.toLowerCase()] || colors.bronze)}>
      {rank.charAt(0).toUpperCase() + rank.slice(1)}
    </span>
  );
}
