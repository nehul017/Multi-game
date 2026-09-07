'use client';

import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { GameArtwork } from '@/components/home/GameArtwork';
import { formatPlayerCount } from '@/data/home';
import { cn } from '@/lib/utils';
import { gameDetailsHref, gamePlayHref } from '@/types/home';
import type { HomeGame } from '@/types/home';

interface GameCardProps {
  game: HomeGame;
  badge?: string;
  priority?: boolean;
  variant?: 'shelf' | 'library';
}

export function GameCard({ game, badge, priority = false, variant = 'shelf' }: GameCardProps) {
  const detailsHref = gameDetailsHref(game.slug);
  const playHref = gamePlayHref(game.slug);
  const showOnline = game.onlinePlayers > 0;
  const categoryLabel = game.genre.split(' / ')[0] || game.category;
  const typeLabel = game.isMultiplayer ? 'Multiplayer' : 'Casual';

  return (
    <article className="group relative h-full flex flex-col rounded-card overflow-hidden border border-theme bg-theme-card shadow-card motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:hover:shadow-card-hover motion-safe:hover:-translate-y-1">
      <Link
        href={detailsHref}
        className="relative block aspect-video overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/70"
        aria-label={`${game.name} details`}
      >
        <GameArtwork
          alt={`${game.name} cover art`}
          tone={game.artTone}
          src={game.image}
          priority={priority}
          className="absolute inset-0"
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 28vw"
        />
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1.5">
          {badge && (
            <Badge variant="purple" className="backdrop-blur-md bg-primary-500/85 text-white border-white/10">
              {badge}
            </Badge>
          )}
          {game.isNew && badge !== 'NEW' && (
            <Badge variant="warning" className="backdrop-blur-md">
              NEW
            </Badge>
          )}
          {showOnline && (
            <Badge variant="success" className="backdrop-blur-md">
              ONLINE
            </Badge>
          )}
        </div>
        <div className="absolute inset-0 bg-black/0 motion-safe:transition-colors motion-safe:duration-200 sm:group-hover:bg-black/35" />
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center pointer-events-none',
            'opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100',
            'motion-safe:transition-opacity motion-safe:duration-200'
          )}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-slate-900 text-sm font-semibold shadow-lg">
            <Play className="w-4 h-4 fill-current" />
            Play
          </span>
        </div>
      </Link>

      <div className="p-3.5 flex flex-col gap-3 flex-1">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-theme-primary truncate">
            <Link
              href={detailsHref}
              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
            >
              {game.name}
            </Link>
          </h3>
          {variant === 'library' ? (
            <>
              <p className="text-sm text-theme-muted line-clamp-2 mt-1">{game.description}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <Badge variant="default">{categoryLabel}</Badge>
                <Badge variant="info">{typeLabel}</Badge>
              </div>
            </>
          ) : (
            <p className="text-sm text-theme-muted truncate mt-0.5">{game.genre}</p>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-theme-muted min-w-0">
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" aria-hidden="true" />
              <span className="text-theme-primary font-medium">{game.rating.toFixed(1)}</span>
            </span>
            {game.plays > 0 && (
              <span className="truncate">{formatPlayerCount(game.plays)} plays</span>
            )}
          </div>
          <Link
            href={playHref}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl bg-primary-500 text-white text-xs font-semibold hover:bg-primary-400 opacity-90 group-hover:opacity-100 motion-safe:transition-all motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            aria-label={`Play ${game.name}`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            PLAY
          </Link>
        </div>
      </div>
    </article>
  );
}
