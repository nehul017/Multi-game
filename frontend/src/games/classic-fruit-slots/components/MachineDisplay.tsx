'use client';

import { cn } from '@/lib/utils';

interface MachineDisplayProps {
  label: string;
  value: string | number;
  tone?: 'gold' | 'green' | 'red';
  live?: boolean;
}

export function MachineDisplay({ label, value, tone = 'gold', live }: MachineDisplayProps) {
  return (
    <div className={cn('cfs-display', `cfs-display-${tone}`)}>
      <span className="cfs-display-label">{label}</span>
      <strong className="cfs-display-value">{typeof value === 'number' ? value.toLocaleString() : value}</strong>
      {live !== undefined && <span className={cn('cfs-display-live', live ? 'is-on' : 'is-off')} />}
    </div>
  );
}
