'use client';

import Link from 'next/link';
import { Radio, Swords, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GameArtwork } from '@/components/home/GameArtwork';
import { SectionReveal } from '@/components/home/SectionReveal';
import { MULTIPLAYER_ARTWORK } from '@/data/artwork';
import { formatPlayerCount } from '@/data/home';
import type { HomeMultiplayerStats } from '@/types/home';

interface MultiplayerBannerProps {
  stats: HomeMultiplayerStats;
}

export function MultiplayerBanner({ stats }: MultiplayerBannerProps) {
  return (
    <SectionReveal id="multiplayer" className="py-10 md:py-16">
      <div className="home-container">
        <div className="relative overflow-hidden rounded-card min-h-[320px] md:min-h-[380px] surface-card p-0">
          <GameArtwork
            alt="Players competing together in a multiplayer arena"
            tone="galaxy"
            src={MULTIPLAYER_ARTWORK}
            zoomOnHover={false}
            className="absolute inset-0"
            sizes="100vw"
          />
          <div className="absolute inset-0 home-multi-overlay" aria-hidden="true" />

          <div className="relative z-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-8 p-6 sm:p-10 md:p-14">
            <div className="max-w-xl">
              <p className="text-xs font-semibold tracking-[0.2em] text-cyan-300 mb-3">LIVE MULTIPLAYER</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                Play With Friends
              </h2>
              <p className="text-white/75 text-base leading-relaxed mb-8">
                Challenge other players and discover multiplayer games.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/games" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto" leftIcon={<Swords className="w-4 h-4" />}>
                    CREATE ROOM
                  </Button>
                </Link>
                <Link href="/games" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    JOIN ROOM
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex lg:items-end lg:justify-end">
              <dl className="grid grid-cols-2 gap-3 w-full max-w-md">
                <div className="home-stat-tile">
                  <dt className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/60">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    Online now
                  </dt>
                  <dd className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white">
                    {formatPlayerCount(stats.onlinePlayers)}
                  </dd>
                </div>
                <div className="home-stat-tile">
                  <dt className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/60">
                    <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                    Active rooms
                  </dt>
                  <dd className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white">
                    {stats.activeRooms}
                  </dd>
                </div>
                <div className="home-stat-tile col-span-2">
                  <dt className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/60">
                    <Users className="w-3.5 h-3.5" aria-hidden="true" />
                    Ready when you are
                  </dt>
                  <dd className="mt-2 text-sm text-white/80">
                    Drop into an open lobby or host a private match in seconds.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
