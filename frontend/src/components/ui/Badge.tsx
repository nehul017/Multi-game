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
    default: 'bg-theme-secondary text-theme-muted border border-theme',
    success: 'bg-theme-success/15 text-theme-success border border-theme-success/30',
    warning: 'bg-theme-warning/15 text-theme-warning border border-theme-warning/30',
    danger: 'bg-theme-danger/15 text-theme-danger border border-theme-danger/30',
    info: 'bg-primary-500/15 text-primary-500 border border-primary-500/30',
    purple: 'bg-primary-500/15 text-primary-500 border border-primary-500/30',
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
    bronze: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
    silver: 'bg-slate-400/20 text-slate-500 border-slate-400/30',
    gold: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    platinum: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30',
    diamond: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    master: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
    grandmaster: 'bg-red-500/20 text-red-600 border-red-500/30',
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border', colors[rank.toLowerCase()] || colors.bronze)}>
      {rank.charAt(0).toUpperCase() + rank.slice(1)}
    </span>
  );
}
