'use client';

import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  floating?: boolean;
  className?: string;
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  online,
  floating = false,
  className,
}: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const statusSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  };

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0',
        floating && 'animate-avatar-float',
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={cn(
            'rounded-full object-cover border-2 border-theme shadow-card',
            sizes[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center bg-gradient-primary text-white font-semibold border-2 border-theme shadow-glow-purple',
            sizes[size]
          )}
        >
          {name ? getInitials(name) : '?'}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-[var(--bg-card)]',
            statusSizes[size],
            online ? 'bg-theme-success' : 'bg-theme-muted'
          )}
        />
      )}
    </div>
  );
}
