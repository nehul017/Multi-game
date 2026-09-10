'use client';

import Link from 'next/link';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Compass, Play, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GameArtwork } from '@/components/home/GameArtwork';
import { HeroAtmosphere } from '@/components/home/HeroAtmosphere';
import { FEATURED_BACKDROP } from '@/data/home';
import { useFinePointer } from '@/hooks/useFinePointer';
import { heroContainer, heroItem } from '@/lib/motion';
import { gamePlayHref } from '@/types/home';
import type { FeaturedGame } from '@/types/home';

interface HeroSectionProps {
  game: FeaturedGame;
}

export function HeroSection({ game }: HeroSectionProps) {
  const reduceMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const artX = useSpring(useTransform(px, [-1, 1], [-10, 10]), { stiffness: 70, damping: 22 });
  const artY = useSpring(useTransform(py, [-1, 1], [-7, 7]), { stiffness: 70, damping: 22 });
  const bgX = useSpring(useTransform(px, [-1, 1], [-6, 6]), { stiffness: 50, damping: 24 });
  const bgY = useSpring(useTransform(py, [-1, 1], [-4, 4]), { stiffness: 50, damping: 24 });
  const canParallax = Boolean(finePointer && !reduceMotion);

  return (
    <section
      className="relative isolate overflow-hidden min-h-[420px] md:min-h-[480px] lg:min-h-[520px]"
      onMouseMove={
        canParallax
          ? (event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              px.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
              py.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
            }
          : undefined
      }
      onMouseLeave={
        canParallax
          ? () => {
              px.set(0);
              py.set(0);
            }
          : undefined
      }
    >
      <motion.div className="absolute inset-0" style={canParallax ? { x: bgX, y: bgY, scale: 1.04 } : undefined}>
        <GameArtwork
          alt=""
          tone={game.artTone}
          src={FEATURED_BACKDROP}
          priority
          zoomOnHover={false}
          className="absolute inset-0"
          sizes="100vw"
        />
      </motion.div>
      <div className="absolute inset-0 home-hero-overlay" aria-hidden="true" />
      <HeroAtmosphere />

      <div className="relative home-container grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-center py-14 md:py-16">
        <motion.div
          initial={reduceMotion ? false : 'hidden'}
          animate="show"
          variants={reduceMotion ? undefined : heroContainer}
          className="max-w-xl"
        >
          <motion.p variants={heroItem} className="hero-eyebrow">
            Enter the arena
          </motion.p>
          <motion.div variants={heroItem}>
            <Badge variant="purple" size="md" className="tracking-[0.18em] uppercase mb-4">
              {game.badge}
            </Badge>
          </motion.div>
          <motion.h1
            variants={heroItem}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-3"
          >
            {game.name}
          </motion.h1>
          <motion.p variants={heroItem} className="text-base text-white/75 max-w-lg mb-5 leading-relaxed">
            {game.description}
          </motion.p>

          <motion.ul variants={heroItem} className="flex flex-wrap items-center gap-2 mb-7">
            <li className="home-meta-pill">{game.genre}</li>
            <li className="home-meta-pill">
              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" aria-hidden="true" />
              <span>{game.rating.toFixed(1)}</span>
            </li>
          </motion.ul>

          <motion.div variants={heroItem} className="flex flex-col sm:flex-row gap-3">
            <Link href={gamePlayHref(game.slug)} className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto home-cta"
                leftIcon={<Play className="w-4 h-4 fill-current" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                PLAY NOW
              </Button>
            </Link>
            <Link href="/games" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto home-cta"
                leftIcon={<Compass className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                EXPLORE GAMES
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.48, delay: reduceMotion ? 0 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="hidden lg:block"
        >
          <motion.div
            className="relative aspect-video rounded-card overflow-hidden ring-1 ring-white/10 shadow-card-hover home-hero-stage"
            style={canParallax ? { x: artX, y: artY } : undefined}
          >
            <GameArtwork
              alt={`${game.name} cinematic artwork`}
              tone={game.artTone}
              src={game.image}
              priority
              featured
              zoomOnHover={false}
              className="absolute inset-0"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
