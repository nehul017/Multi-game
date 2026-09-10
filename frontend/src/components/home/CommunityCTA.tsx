'use client';

import Link from 'next/link';
import { ArrowRight, MessageCircle, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GameArtwork } from '@/components/home/GameArtwork';
import { SectionReveal } from '@/components/home/SectionReveal';
import { MULTIPLAYER_ARTWORK } from '@/data/artwork';
import { useAuthStore } from '@/store/auth.store';

export function CommunityCTA() {
  const { isAuthenticated } = useAuthStore();

  return (
    <SectionReveal id="community" className="py-10 md:py-16">
      <div className="home-container">
        <div className="relative overflow-hidden rounded-card min-h-[260px] border border-theme">
          <GameArtwork
            alt=""
            tone="arena"
            src={MULTIPLAYER_ARTWORK}
            zoomOnHover={false}
            className="absolute inset-0"
            sizes="100vw"
          />
          <div className="absolute inset-0 home-multi-overlay" aria-hidden="true" />
          <div className="relative z-10 px-6 py-10 sm:px-10 md:px-14 md:py-14 max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary-300 mb-3">COMMUNITY</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              Play with the arena
            </h2>
            <p className="text-white/75 text-base leading-relaxed mb-7">
              Challenge friends, join live rooms, and climb weekly tournaments.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={isAuthenticated ? '/friends' : '/register'} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto home-cta"
                  leftIcon={<Users className="w-4 h-4" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isAuthenticated ? 'Find Friends' : 'Join GAMEHUB'}
                </Button>
              </Link>
              <Link href="/tournaments" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto" leftIcon={<Trophy className="w-4 h-4" />}>
                  Tournaments
                </Button>
              </Link>
              {isAuthenticated && (
                <Link href="/chat" className="w-full sm:w-auto">
                  <Button size="lg" variant="ghost" className="w-full sm:w-auto text-white hover:text-white" leftIcon={<MessageCircle className="w-4 h-4" />}>
                    Chat
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
