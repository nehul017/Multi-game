'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GameArtwork } from '@/components/home/GameArtwork';
import { SectionHeader, SectionReveal } from '@/components/home/SectionReveal';
import { formatRelativeTime } from '@/lib/utils';
import { gamePlayHref } from '@/types/home';
import type { RecentGame } from '@/types/home';

interface RecentlyPlayedProps {
  games: RecentGame[];
}

export function RecentlyPlayed({ games }: RecentlyPlayedProps) {
  if (!games.length) return null;

  return (
    <SectionReveal id="recent" className="py-6 md:py-10 pb-16 md:pb-20">
      <div className="home-container">
        <SectionHeader title="Recently Played" href="/dashboard" linkLabel="Continue in Dashboard →" />
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {games.map((game) => (
            <li key={game.id} className="surface-card p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0">
                <GameArtwork
                  alt={`${game.name} thumbnail`}
                  tone={game.artTone}
                  src={game.image}
                  zoomOnHover={false}
                  className="absolute inset-0"
                  sizes="96px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-semibold text-theme-primary truncate">{game.name}</h3>
                <p className="text-xs text-theme-muted mt-0.5">
                  Last played {formatRelativeTime(game.lastPlayed)}
                </p>
                <ProgressBar
                  value={game.progress}
                  label="Progress"
                  size="sm"
                  className="mt-3"
                />
              </div>
              <Link href={gamePlayHref(game.slug)} className="shrink-0 w-full sm:w-auto">
                <Button size="sm" className="w-full sm:w-auto" leftIcon={<Play className="w-3.5 h-3.5 fill-current" />} aria-label={`Continue ${game.name}`}>
                  Continue
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </SectionReveal>
  );
}
