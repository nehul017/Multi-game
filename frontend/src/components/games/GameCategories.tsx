'use client';

import { LIBRARY_CATEGORIES } from '@/data/home';
import { cn } from '@/lib/utils';
import type { LibraryCategoryId } from '@/types/home';

interface GameCategoriesProps {
  selected: string;
  onSelect: (category: LibraryCategoryId) => void;
}

export function GameCategories({ selected, onSelect }: GameCategoriesProps) {
  const active = selected || 'all';

  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1"
      role="tablist"
      aria-label="Game categories"
    >
      {LIBRARY_CATEGORIES.map((item) => {
        const isSelected = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(item.id)}
            className={cn(
              'h-10 px-3.5 rounded-full text-sm font-medium whitespace-nowrap border motion-safe:transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
              isSelected
                ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                : 'bg-theme-card text-theme-muted border-theme hover:text-theme-primary hover:border-primary-500/40'
            )}
          >
            <span aria-hidden="true" className="mr-1.5">
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
