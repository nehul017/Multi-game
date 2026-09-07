'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Compass, Play, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GameArtwork } from '@/components/home/GameArtwork';
import { FEATURED_BACKDROP } from '@/data/home';
import { gamePlayHref } from '@/types/home';
import type { FeaturedGame } from '@/types/home';

interface HeroSectionProps {
  game: FeaturedGame;
}

export function HeroSection({ game }: HeroSectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden min-h-[420px] md:min-h-[480px] lg:min-h-[520px]">
      <GameArtwork
        alt=""
        tone={game.artTone}
        src={FEATURED_BACKDROP}
        priority
        zoomOnHover={false}
        className="absolute inset-0"
        sizes="100vw"
      />
      <div className="absolute inset-0 home-hero-overlay" aria-hidden="true" />

      <div className="relative home-container grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-center py-14 md:py-16">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-xl"
        >
          <Badge variant="purple" size="md" className="tracking-[0.18em] uppercase mb-4">
            {game.badge}
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-3">
            {game.name}
          </h1>
          <p className="text-base text-white/75 max-w-lg mb-5 leading-relaxed">
            {game.description}
          </p>

          <ul className="flex flex-wrap items-center gap-2 mb-7">
            <li className="home-meta-pill">{game.genre}</li>
            <li className="home-meta-pill">
              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" aria-hidden="true" />
              <span>{game.rating.toFixed(1)}</span>
            </li>
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={gamePlayHref(game.slug)} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto" leftIcon={<Play className="w-4 h-4 fill-current" />}>
                PLAY NOW
              </Button>
            </Link>
            <Link href="/games" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto" leftIcon={<Compass className="w-4 h-4" />}>
                EXPLORE GAMES
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="hidden lg:block"
        >
          <div className="relative aspect-video rounded-card overflow-hidden ring-1 ring-white/10 shadow-card-hover">
            <GameArtwork
              alt={`${game.name} cinematic artwork`}
              tone={game.artTone}
              src={game.image}
              priority
              zoomOnHover={false}
              className="absolute inset-0"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
