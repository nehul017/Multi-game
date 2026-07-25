'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Play, Search, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGames } from '@/hooks';

const slugIcons: Record<string, string> = {
  'tic-tac-toe': '⭕',
  'connect-four': '🔴',
  'chess': '♟️',
  'snake-multiplayer': '🐍',
  'ludo': '🎲',
  'quiz-battle': '🧠',
};

const slugColors: Record<string, { color: string; borderColor: string; iconBg: string }> = {
  'tic-tac-toe': {
    color: 'from-purple-500/[0.12] to-pink-500/[0.06]',
    borderColor: 'border-purple-500/25',
    iconBg: 'bg-purple-500/15',
  },
  'connect-four': {
    color: 'from-cyan-500/[0.12] to-blue-500/[0.06]',
    borderColor: 'border-cyan-500/25',
    iconBg: 'bg-cyan-500/15',
  },
  'chess': {
    color: 'from-amber-500/[0.14] to-orange-500/[0.06]',
    borderColor: 'border-amber-500/25',
    iconBg: 'bg-amber-500/15',
  },
  'snake-multiplayer': {
    color: 'from-green-500/[0.12] to-emerald-500/[0.06]',
    borderColor: 'border-green-500/25',
    iconBg: 'bg-green-500/15',
  },
  'ludo': {
    color: 'from-rose-500/[0.12] to-red-500/[0.06]',
    borderColor: 'border-rose-500/25',
    iconBg: 'bg-rose-500/15',
  },
  'quiz-battle': {
    color: 'from-indigo-500/[0.12] to-violet-500/[0.06]',
    borderColor: 'border-indigo-500/25',
    iconBg: 'bg-indigo-500/15',
  },
};

const defaultStyle = {
  color: 'from-slate-500/[0.1] to-slate-500/[0.04]',
  borderColor: 'border-theme',
  iconBg: 'bg-theme-secondary',
};

export default function GamesPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useGames();

  const rawData = data?.data as unknown;
  const games = (Array.isArray(rawData) ? rawData : (rawData as Record<string, unknown>)?.data || []) as Array<Record<string, unknown>>;
  const filteredGames = games.filter((g) =>
    ((g.name as string) || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="page-heading text-2xl md:text-3xl">Games</h1>
              <p className="text-theme-muted mt-1">Choose a game and start playing</p>
            </div>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search games..."
              className="w-full md:w-64"
            />
          </div>
        </motion.div>

        {isError && (
          <div className="text-center py-16">
            <p className="text-theme-muted mb-4">Failed to load games</p>
            <Button variant="outline" onClick={() => refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Retry
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-theme-card border border-theme rounded-2xl p-6 space-y-4">
                <div className="text-center">
                  <Skeleton className="h-12 w-12 mx-auto rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game, i) => {
              const slug = game.slug as string;
              const style = slugColors[slug] || defaultStyle;
              const icon = slugIcons[slug] || '🎮';
              return (
                <motion.div
                  key={slug || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card hover className={`bg-gradient-to-br ${style.color} border ${style.borderColor}`}>
                    <div className="text-center mb-4">
                      <span
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl text-4xl ${style.iconBg}`}
                      >
                        {icon}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-theme-primary font-display mb-2">
                      {game.name as string}
                    </h3>
                    <p className="text-sm text-theme-muted mb-4 line-clamp-2">
                      {game.description as string}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="info">{(game.category as string) || 'Game'}</Badge>
                      <div className="flex items-center gap-1 text-xs text-theme-muted">
                        <Users className="w-3 h-3" />
                        <span>
                          {(game.minPlayers as number) || 2}-{(game.maxPlayers as number) || 2} Players
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/games/${slug}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/games/${slug}/play`}>
                        <Button size="sm" leftIcon={<Play className="w-4 h-4" />}>
                          Play
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {!isLoading && !isError && filteredGames.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-theme-muted mx-auto mb-4 opacity-50" />
            <p className="text-theme-muted">
              {search ? `No games found matching "${search}"` : 'No games available'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
