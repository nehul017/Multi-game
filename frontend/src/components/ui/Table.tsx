'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  className,
  emptyMessage = 'No data found',
}: TableProps<T>) {
  return (
    <div className={cn('table-glass overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-theme">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-3 sm:px-5 py-3 sm:py-4 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider whitespace-nowrap',
                  col.sortable && 'cursor-pointer hover:text-theme-primary transition-colors',
                  col.className
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-14 text-center text-theme-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={index}
                onClick={() => onRowClick?.(item)}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-3 sm:px-5 py-3 sm:py-4 text-sm text-theme-primary rounded-lg whitespace-nowrap', col.className)}
                  >
                    {col.render ? col.render(item) : (item[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
