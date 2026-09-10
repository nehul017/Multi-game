'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { FeaturedGameCard } from './FeaturedGameCard';
import { StaggerGrid } from '@/components/home/SectionReveal';
import { staggerItem } from '@/lib/motion';
import type { HomeGame } from '@/types/home';

interface FeaturedGamesProps {
  games: HomeGame[];
}

export function FeaturedGames({ games }: FeaturedGamesProps) {
  const reduceMotion = useReducedMotion();

  if (games.length === 0) return null;

  return (
    <section className="space-y-4 min-w-0">
      <h2 className="home-section-heading text-lg sm:text-xl font-semibold text-theme-primary font-display">Featured Games</h2>
      <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {games.map((game, index) => (
          <motion.div key={game.id} variants={reduceMotion ? undefined : staggerItem}>
            <FeaturedGameCard game={game} priority={index < 2} />
          </motion.div>
        ))}
      </StaggerGrid>
    </section>
  );
}
