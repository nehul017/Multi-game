'use client';

import Link from 'next/link';
import { Play, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { GameArtwork } from '@/components/home/GameArtwork';
import { GameCardTilt } from '@/components/motion/GameCardTilt';
import { PlayCta } from '@/components/motion/PlayCta';
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
    <GameCardTilt>
      <article className="home-game-card group relative flex flex-col">
        <Link
          href={detailsHref}
          className="relative block aspect-[16/10] overflow-hidden home-game-card-media focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/70"
          aria-label={`${game.name} details`}
        >
          <GameArtwork
            alt={`${game.name} cover art`}
            tone={game.artTone}
            src={game.image}
            priority={priority}
            featured
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
          <div className="home-game-card-overlay" />
          <div className="home-game-card-play">
            <span className="home-play-cta home-play-cta-overlay home-play-cta-md">
              <span className="home-play-cta-glow" aria-hidden="true" />
              <Play className="home-play-cta-icon" />
              <span>Play</span>
            </span>
          </div>
        </Link>

        <div className="p-4 sm:p-5 flex flex-col gap-4 flex-1">
          <div className="min-w-0">
            <h3 className="home-game-title font-display text-lg font-semibold text-theme-primary truncate">
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
            <PlayCta href={playHref} label="Play Now" ariaLabel={`Play ${game.name}`} size="md" />
          </div>
        </div>
      </article>
    </GameCardTilt>
  );
}
