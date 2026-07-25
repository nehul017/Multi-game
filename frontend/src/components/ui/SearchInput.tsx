'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({ value: externalValue, onChange, placeholder = 'Search...', debounceMs = 300, className }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(externalValue || '');

  useEffect(() => {
    if (externalValue !== undefined) {
      setLocalValue(externalValue);
    }
  }, [externalValue]);

  const debouncedOnChange = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (val: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => onChange(val), debounceMs);
      };
    })(),
    [onChange, debounceMs]
  );

  const handleChange = (val: string) => {
    setLocalValue(val);
    debouncedOnChange(val);
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="input-glass w-full pl-10 pr-10 py-2.5 text-sm"
      />
      {localValue && (
        <button
          onClick={() => handleChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
