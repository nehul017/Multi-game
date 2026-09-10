'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Crown, Trophy } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { SectionHeader, SectionReveal, StaggerGrid } from '@/components/home/SectionReveal';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { staggerItem } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { HomeLeaderboardEntry } from '@/types/home';

interface LeaderboardPreviewProps {
  players: HomeLeaderboardEntry[];
}

function formatXp(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(xp);
}

export function LeaderboardPreview({ players }: LeaderboardPreviewProps) {
  const reduceMotion = useReducedMotion();

  return (
    <SectionReveal id="leaderboard" className="py-6 md:py-10">
      <div className="home-container">
        <SectionHeader title="🏆 Top Players" href="/leaderboard" linkLabel="View Full Leaderboard →" />

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {players.slice(0, 3).map((player) => {
            const isFirst = player.rank === 1;
            return (
              <motion.div
                key={player.userId}
                variants={reduceMotion ? undefined : staggerItem}
                className={cn(
                  'relative surface-card p-5 sm:p-6 flex flex-col gap-4 h-full',
                  isFirst && 'md:-translate-y-1 ring-1 ring-amber-400/30 shadow-card-hover'
                )}
              >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2 rounded-xl text-sm font-bold',
                        isFirst
                          ? 'bg-amber-400/15 text-amber-300'
                          : player.rank === 2
                            ? 'bg-slate-400/15 text-slate-300'
                            : 'bg-orange-500/15 text-orange-300'
                      )}
                    >
                      #{player.rank}
                    </span>
                    {isFirst ? (
                      <Crown className="w-5 h-5 text-amber-300" aria-label="First place" />
                    ) : (
                      <Trophy className="w-5 h-5 text-theme-muted" aria-hidden="true" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={player.username} src={player.avatar} size={isFirst ? 'lg' : 'md'} />
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-theme-primary truncate">{player.username}</p>
                      <p className="text-sm text-theme-muted">Level {player.level}</p>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 pt-2 border-t border-theme">
                    <div>
                      <dt className="text-xs text-theme-muted">XP</dt>
                      <dd className="text-sm font-semibold text-theme-primary">
                        <AnimatedCounter value={player.xp} format={formatXp} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-theme-muted">Wins</dt>
                      <dd className="text-sm font-semibold text-theme-primary">
                        <AnimatedCounter value={player.wins} />
                      </dd>
                    </div>
                  </dl>
              </motion.div>
            );
          })}
        </StaggerGrid>

        <div className="mt-6 md:hidden">
          <Link
            href="/leaderboard"
            className="text-sm font-medium text-primary-400 hover:text-primary-300"
          >
            View Full Leaderboard →
          </Link>
        </div>
      </div>
    </SectionReveal>
  );
}
