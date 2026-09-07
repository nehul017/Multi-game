'use client';

import { Gamepad2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { GameCard } from '@/components/home/GameCard';
import { GameCardSkeleton } from '@/components/home/HomeSkeletons';
import { SectionHeader, SectionReveal } from '@/components/home/SectionReveal';
import { cn } from '@/lib/utils';
import type { HomeGame } from '@/types/home';

interface GameShelfProps {
  id: string;
  title?: string;
  href?: string;
  games: HomeGame[];
  badge?: (game: HomeGame) => string | undefined;
  columns?: 'trending' | 'popular';
  priorityCount?: number;
  isLoading?: boolean;
  emptyAction?: () => void;
}

export function GameShelf({
  id,
  title,
  href,
  games,
  badge,
  columns = 'popular',
  priorityCount = 0,
  isLoading = false,
  emptyAction,
}: GameShelfProps) {
  return (
    <SectionReveal id={id} className="py-6 md:py-10">
      <div className="home-container">
        {title ? <SectionHeader title={title} href={href} /> : null}
        {isLoading ? (
          <div className={cn('home-game-grid', columns === 'trending' && 'home-game-grid-wide')}>
            {Array.from({ length: columns === 'trending' ? 5 : 4 }).map((_, index) => (
              <GameCardSkeleton key={`${id}-sk-${index}`} />
            ))}
          </div>
        ) : games.length === 0 ? (
          <EmptyState
            icon={<Gamepad2 className="w-9 h-9 text-theme-muted" />}
            title="No games found"
            description="Try another search or browse our categories."
            action={emptyAction ? { label: 'Browse Games', onClick: emptyAction } : undefined}
          />
        ) : (
          <div className={cn('home-game-grid', columns === 'trending' && 'home-game-grid-wide')}>
            {games.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                badge={badge?.(game)}
                priority={index < priorityCount}
              />
            ))}
          </div>
        )}
      </div>
    </SectionReveal>
  );
}
