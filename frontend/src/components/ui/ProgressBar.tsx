'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue,
  variant = 'primary',
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variants = {
    primary: 'progress-fill',
    secondary: 'bg-secondary-500 h-full rounded-full',
    success: 'bg-theme-success h-full rounded-full',
    warning: 'bg-theme-warning h-full rounded-full',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-xs font-medium text-theme-muted">{label}</span>}
          {showValue && (
            <span className="text-xs font-medium text-theme-primary">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className={cn('progress-track w-full', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
