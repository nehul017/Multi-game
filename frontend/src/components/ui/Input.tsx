'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full group">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-theme-muted mb-2 transition-colors group-focus-within:text-primary-500"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted transition-colors group-focus-within:text-primary-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input-glass w-full px-4 py-3 text-sm',
              icon && 'pl-11',
              rightIcon && 'pr-11',
              error && 'border-theme-danger focus:ring-theme-danger/30',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-theme-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };
