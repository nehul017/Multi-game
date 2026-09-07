'use client';

import { FeaturedGameCard } from './FeaturedGameCard';
import type { HomeGame } from '@/types/home';

interface FeaturedGamesProps {
  games: HomeGame[];
}

export function FeaturedGames({ games }: FeaturedGamesProps) {
  if (games.length === 0) return null;

  return (
    <section className="space-y-4 min-w-0">
      <h2 className="text-lg sm:text-xl font-semibold text-theme-primary font-display">Featured Games</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {games.map((game, index) => (
          <FeaturedGameCard key={game.id} game={game} priority={index < 2} />
        ))}
      </div>
    </section>
  );
}
