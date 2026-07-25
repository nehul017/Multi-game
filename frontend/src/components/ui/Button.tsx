'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: 'btn-primary-gradient font-semibold',
      secondary: 'btn-secondary-glass font-medium',
      outline:
        'border border-theme text-theme-primary hover:border-primary-500 hover:bg-primary-500/10 font-medium',
      ghost: 'text-theme-muted hover:bg-primary-500/8 hover:text-theme-primary font-medium',
      danger: 'bg-theme-danger text-white hover:opacity-90 font-medium',
    };

    const sizes = {
      sm: 'px-3.5 py-1.5 text-xs rounded-xl',
      md: 'px-5 py-2.5 text-sm rounded-2xl',
      lg: 'px-7 py-3.5 text-base rounded-2xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-transform duration-200 will-change-transform',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
          !disabled && !isLoading && 'hover:scale-[1.03] active:scale-[0.97]',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon && !isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
export type { ButtonProps };
