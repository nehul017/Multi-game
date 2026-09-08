'use client';

import { Search } from 'lucide-react';
import { GameCard } from '@/components/home/GameCard';
import { GameCardSkeleton } from '@/components/home/HomeSkeletons';
import { EmptyState } from '@/components/ui/EmptyState';
import type { HomeGame } from '@/types/home';

interface AllGamesProps {
  games: HomeGame[];
  isLoading?: boolean;
  isError?: boolean;
  hasActiveFilters?: boolean;
  onReset?: () => void;
}

export function AllGames({
  games,
  isLoading = false,
  isError = false,
  hasActiveFilters = false,
  onReset,
}: AllGamesProps) {
  return (
    <section className="space-y-4 min-w-0">
      <h2 className="text-lg sm:text-xl font-semibold text-theme-primary font-display">All Games</h2>

      {isLoading && games.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <GameCardSkeleton key={index} />
          ))}
        </div>
      ) : games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {games.map((game, index) => (
            <GameCard key={game.id} game={game} priority={index < 4} variant="library" />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="w-9 h-9 text-theme-muted" />}
          title={isError ? 'Could not load games' : hasActiveFilters ? 'No games found' : 'No games available'}
          description={
            isError
              ? 'Check your connection and try again.'
              : hasActiveFilters
                ? 'Try another search or browse a different category.'
                : 'Games from the database will appear here once they are published.'
          }
          action={onReset && (hasActiveFilters || isError) ? { label: 'Browse Games', onClick: onReset } : undefined}
        />
      )}
    </section>
  );
}
