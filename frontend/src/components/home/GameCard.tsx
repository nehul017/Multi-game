'use client';

import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { GameArtwork } from '@/components/home/GameArtwork';
import { GameCardTilt } from '@/components/motion/GameCardTilt';
import { PlayCta } from '@/components/motion/PlayCta';
import { formatPlayerCount } from '@/data/home';
import { gameDetailsHref, gamePlayHref } from '@/types/home';
import type { HomeGame } from '@/types/home';

interface GameCardProps {
  game: HomeGame;
  badge?: string;
  priority?: boolean;
  variant?: 'shelf' | 'library';
  featured?: boolean;
}

export function GameCard({
  game,
  badge,
  priority = false,
  variant = 'shelf',
  featured = false,
}: GameCardProps) {
  const detailsHref = gameDetailsHref(game.slug);
  const playHref = gamePlayHref(game.slug);
  const showOnline = game.onlinePlayers > 0;
  const categoryLabel = game.genre.split(' / ')[0] || game.category;
  const typeLabel = game.isMultiplayer ? 'Multiplayer' : 'Casual';
  const difficulty = game.tags.find((tag) => tag === 'Easy' || tag === 'Medium' || tag === 'Hard');
  const premium = featured || Boolean(game.isFeatured || game.isTrending);

  return (
    <GameCardTilt>
      <article className="home-game-card group relative h-full flex flex-col">
        <Link
          href={detailsHref}
          className="relative block aspect-video overflow-hidden home-game-card-media focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/70"
          aria-label={`${game.name} details`}
        >
          <GameArtwork
            alt={`${game.name} cover art`}
            tone={game.artTone}
            src={game.image}
            priority={priority}
            featured={premium}
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
          <div className="home-game-card-overlay" />
          <div className="home-game-card-play">
            <span className="home-play-cta home-play-cta-overlay">
              <span className="home-play-cta-glow" aria-hidden="true" />
              <Play className="home-play-cta-icon" />
              <span>Play</span>
            </span>
          </div>
        </Link>

        <div className="p-3.5 flex flex-col gap-3 flex-1">
          <div className="min-w-0">
            <h3 className="home-game-title font-display font-semibold text-theme-primary truncate">
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
                  {difficulty ? <Badge variant="warning">{difficulty}</Badge> : <Badge variant="info">{typeLabel}</Badge>}
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
            <PlayCta href={playHref} ariaLabel={`Play ${game.name}`} />
          </div>
        </div>
      </article>
    </GameCardTilt>
  );
}
