'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { RankBadge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Skeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import { useLeaderboard, useGames } from '@/hooks';
import { cn } from '@/lib/utils';

type Period = 'daily' | 'weekly' | 'monthly' | 'all';

interface LeaderboardPlayer {
  rank: number;
  userId?: string;
  username: string;
  avatar?: string;
  elo: number;
  score?: number;
  wins: number;
  losses: number;
  winRate: number;
  level: number;
  gamesPlayed?: number;
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('all');
  const [gameFilter, setGameFilter] = useState('all');

  const { data, isLoading, isError, refetch } = useLeaderboard(
    period,
    gameFilter !== 'all' ? gameFilter : undefined
  );
  const { data: gamesData } = useGames();

  const lbPayload = data?.data as unknown;
  const leaderboard: LeaderboardPlayer[] = (Array.isArray(lbPayload) ? lbPayload : (lbPayload as Record<string, unknown>)?.data ?? []) as LeaderboardPlayer[];
  const gPayload = gamesData?.data as unknown;
  const games = (Array.isArray(gPayload) ? gPayload : (gPayload as Record<string, unknown>)?.data ?? []) as Array<{ slug: string; name: string }>;

  const gameOptions = [
    { value: 'all', label: 'All Games' },
    ...games.map((g) => ({ value: g.slug, label: g.name })),
  ];

  const tabs = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'all', label: 'All Time' },
  ];

  const scoreBased = gameFilter === 'block-master' || gameFilter === 'puzzle-world' || gameFilter === 'jigsaw-world';
  const rankValue = (player: LeaderboardPlayer) =>
    scoreBased ? player.score ?? player.elo : player.elo;
  const rankLabel = scoreBased ? 'Score' : 'ELO';

  const top3 = leaderboard.slice(0, 3);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-theme-primary">Leaderboard</h1>
          <p className="text-theme-muted mt-1">
            {scoreBased ? 'Top players ranked by high score' : 'Top players ranked by ELO rating'}
          </p>
        </motion.div>

        {/* Top 3 Podium */}
        {!isLoading && top3.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto px-1">
            {[1, 0, 2].map((idx) => {
              const player = top3[idx];
              const podiumStyles = [
                { height: 'h-24 sm:h-32', bg: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/30', icon: Crown },
                { height: 'h-20 sm:h-24', bg: 'from-gray-400/20 to-gray-500/10', border: 'border-gray-400/30', icon: Medal },
                { height: 'h-16 sm:h-20', bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30', icon: Medal },
              ];
              const style = podiumStyles[idx];
              return (
                <motion.div
                  key={player.rank}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className={cn('flex flex-col items-center min-w-0', idx === 0 && '-mt-2 sm:-mt-4')}
                >
                  <div className="relative mb-2">
                    <Avatar name={player.username} size={idx === 0 ? 'lg' : 'md'} />
                    {idx === 0 && <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-theme-primary text-center truncate max-w-full px-1">{player.username}</p>
                  <p className="text-[10px] sm:text-xs text-theme-muted">
                    {rankValue(player)} {rankLabel}
                  </p>
                  <div className={cn(
                    'w-full mt-2 rounded-t-xl bg-gradient-to-b border-t border-x flex items-center justify-center',
                    style.height, style.bg, style.border
                  )}>
                    <span className="text-lg sm:text-2xl font-display font-bold text-theme-primary">#{player.rank}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="w-12 h-12 rounded-full mb-2" />
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className={`w-full mt-2 rounded-t-xl ${i === 0 ? 'h-32' : i === 1 ? 'h-24' : 'h-20'}`} />
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <Tabs tabs={tabs} activeTab={period} onChange={(v) => setPeriod(v as Period)} />
          <Select
            options={gameOptions}
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="w-40"
          />
        </div>

        {isError && (
          <div className="text-center py-12">
            <p className="text-theme-muted mb-4">Failed to load leaderboard</p>
            <Button variant="outline" onClick={() => refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Retry
            </Button>
          </div>
        )}

        {/* Full Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-lighter/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase">Player</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase">{rankLabel}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase">W/L</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase">Win Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-lighter/20">
                {isLoading && Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}><TableRowSkeleton /></td>
                  </tr>
                ))}
                {!isLoading && leaderboard.map((player) => (
                  <tr key={player.rank} className="hover:bg-surface-light/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className={cn('text-sm font-bold', player.rank <= 3 ? 'text-yellow-400' : 'text-theme-muted')}>
                        #{player.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={player.username} size="sm" />
                        <span className="text-sm font-medium text-theme-primary">{player.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary-400">{rankValue(player)}</td>
                    <td className="px-4 py-3 text-sm text-theme-muted">{player.wins}/{player.losses}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-sm font-medium', player.winRate >= 60 ? 'text-green-400' : 'text-theme-muted')}>
                        {player.winRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-theme-muted">Lvl {player.level}</td>
                  </tr>
                ))}
                {!isLoading && leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Trophy className="w-8 h-8 text-theme-muted mx-auto mb-2" />
                      <p className="text-sm text-theme-muted">No leaderboard data available</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
