'use client';

import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { LIBRARY_SORT_OPTIONS, type LibrarySort } from '@/data/home';

interface GamesHeaderProps {
  search: string;
  sort: LibrarySort;
  onSearchChange: (value: string) => void;
  onSortChange: (value: LibrarySort) => void;
}

export function GamesHeader({ search, sort, onSearchChange, onSortChange }: GamesHeaderProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="page-heading">Games</h1>
        <p className="text-theme-muted mt-1.5 text-base">Choose your next challenge</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 min-w-0">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search games, players..."
          className="w-full sm:flex-1 min-w-0"
        />
        <div className="w-full sm:w-44 shrink-0">
          <Select
            aria-label="Sort games"
            value={sort}
            options={LIBRARY_SORT_OPTIONS}
            onChange={(event) => onSortChange(event.target.value as LibrarySort)}
            className="bg-theme-card border-theme"
          />
        </div>
      </div>
    </div>
  );
}
