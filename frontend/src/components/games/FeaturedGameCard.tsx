'use client';

import Link from 'next/link';
import { Play, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { GameArtwork } from '@/components/home/GameArtwork';
import { formatPlayerCount, playerCountLabel } from '@/data/home';
import { gameDetailsHref, gamePlayHref } from '@/types/home';
import type { HomeGame } from '@/types/home';

interface FeaturedGameCardProps {
  game: HomeGame;
  priority?: boolean;
}

export function FeaturedGameCard({ game, priority = false }: FeaturedGameCardProps) {
  const detailsHref = gameDetailsHref(game.slug);
  const playHref = gamePlayHref(game.slug);
  const playerLabel = playerCountLabel(game);
  const typeLabel = game.isMultiplayer ? 'Multiplayer' : 'Casual';

  return (
    <article className="group relative flex flex-col rounded-card overflow-hidden border border-theme bg-theme-card shadow-card motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-card-hover">
      <Link
        href={detailsHref}
        className="relative block aspect-[16/10] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/70"
        aria-label={`${game.name} details`}
      >
        <GameArtwork
          alt={`${game.name} cover art`}
          tone={game.artTone}
          src={game.image}
          priority={priority}
          className="absolute inset-0"
          sizes="(max-width: 768px) 94vw, (max-width: 1024px) 46vw, 32vw"
        />
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
          <Badge variant="purple" className="backdrop-blur-md bg-primary-500/85 text-white border-white/10">
            Featured
          </Badge>
          <Badge variant="default" className="backdrop-blur-md bg-black/35 text-white border-white/10">
            {game.genre.split(' / ')[0] || game.category}
          </Badge>
        </div>
      </Link>

      <div className="p-4 sm:p-5 flex flex-col gap-4 flex-1">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-theme-primary truncate">
            <Link
              href={detailsHref}
              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
            >
              {game.name}
            </Link>
          </h3>
          <p className="text-sm text-theme-muted mt-1.5 line-clamp-2">{game.description}</p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-theme-muted">
            <Badge variant="info">{typeLabel}</Badge>
            {playerLabel && (
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                {playerLabel.replace(' PLAYERS', ' players')}
              </span>
            )}
            {game.onlinePlayers > 0 && (
              <span>{formatPlayerCount(game.onlinePlayers)} online</span>
            )}
          </div>
          <Link
            href={playHref}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-400 opacity-95 group-hover:opacity-100 motion-safe:transition-all motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            aria-label={`Play ${game.name}`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Play Now
          </Link>
        </div>
      </div>
    </article>
  );
}
