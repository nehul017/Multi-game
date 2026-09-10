'use client';

import Link from 'next/link';
import { ArrowRight, Clock, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionReveal } from '@/components/home/SectionReveal';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import type { HomeTournament } from '@/types/home';

interface TournamentBannerProps {
  tournament: HomeTournament;
}

export function TournamentBanner({ tournament }: TournamentBannerProps) {
  return (
    <SectionReveal id="tournaments" className="py-10 md:py-16">
      <div className="home-container">
        <div className="relative overflow-hidden rounded-card home-tourney-panel px-6 py-8 sm:px-10 sm:py-12 md:px-14 md:py-14">
          <div className="relative z-10 grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-amber-300 mb-3">WEEKLY TOURNAMENT</p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                {tournament.title}
              </h2>
              <p className="text-white/75 text-base sm:text-lg max-w-xl mb-8">
                {tournament.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={tournament.id === 'weekly-arena' ? '/tournaments' : `/tournaments/${tournament.id}`}>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto home-cta"
                    leftIcon={<Trophy className="w-4 h-4" />}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    JOIN TOURNAMENT
                  </Button>
                </Link>
                <Link href="/tournaments">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    VIEW DETAILS
                  </Button>
                </Link>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
              <div className="home-stat-tile home-stat-glow">
                <dt className="text-xs uppercase tracking-wider text-white/60">Prize pool</dt>
                <dd className="mt-1 font-display text-2xl font-bold text-amber-200">{tournament.prizePool}</dd>
              </div>
              <div className="home-stat-tile home-stat-glow">
                <dt className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/60">
                  <Users className="w-3.5 h-3.5" aria-hidden="true" />
                  Players
                </dt>
                <dd className="mt-1 font-display text-2xl font-bold text-white">
                  <AnimatedCounter value={tournament.players} />
                  {tournament.maxPlayers > 0 && (
                    <span className="text-sm font-medium text-white/50">
                      {' '}
                      / {tournament.maxPlayers.toLocaleString()}
                    </span>
                  )}
                </dd>
              </div>
              <div className="home-stat-tile">
                <dt className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/60">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  Starts in
                </dt>
                <dd className="mt-1 font-display text-2xl font-bold text-white">{tournament.countdown}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
