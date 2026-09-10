'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeader, SectionReveal, StaggerGrid } from '@/components/home/SectionReveal';
import { GameArtwork } from '@/components/home/GameArtwork';
import { categoryArtwork } from '@/data/artwork';
import { categoryHref } from '@/data/home';
import { staggerItem } from '@/lib/motion';
import type { HomeCategory } from '@/types/home';

interface CategorySectionProps {
  categories: HomeCategory[];
  counts: Record<string, number>;
}

export function CategorySection({ categories, counts }: CategorySectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <SectionReveal id="categories" className="py-6 md:py-10">
      <div className="home-container">
        <SectionHeader title="Browse Categories" href="/games" />
        <StaggerGrid className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
          {categories.map((category) => {
            const count = counts[category.id] ?? 0;
            return (
              <motion.div key={category.id} variants={reduceMotion ? undefined : staggerItem}>
                <Link
                  href={categoryHref(category.id)}
                  aria-label={`${category.label}, ${count} ${count === 1 ? 'game' : 'games'}`}
                  className="home-category-tile group relative block overflow-hidden rounded-card aspect-[4/3] border border-theme focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
                >
                  <GameArtwork
                    alt=""
                    tone={category.tone}
                    src={categoryArtwork(category.id)}
                    zoomOnHover
                    sizes="(max-width: 640px) 33vw, (max-width: 1280px) 25vw, 16vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                  <div className="absolute inset-0 z-10 flex flex-col items-start justify-end p-3 sm:p-4">
                    <span className="text-2xl sm:text-3xl leading-none mb-2" aria-hidden="true">
                      {category.icon}
                    </span>
                    <p className="home-game-title font-display font-semibold text-white text-sm sm:text-base leading-tight">
                      {category.label}
                    </p>
                    <p className="text-[11px] sm:text-xs text-white/70 mt-0.5">
                      {count} {count === 1 ? 'game' : 'games'}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </StaggerGrid>
      </div>
    </SectionReveal>
  );
}
