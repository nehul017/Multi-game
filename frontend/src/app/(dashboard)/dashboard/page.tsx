'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Trophy, TrendingUp, Star, Zap, Play, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, RankBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/auth.store';
import { useMatchHistory, useFriends } from '@/hooks';
import { usePresence } from '@/socket/hooks';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

function AnimatedCounter({ value }: { value: number | string }) {
  const [display, setDisplay] = useState(typeof value === 'number' ? 0 : value);
  const ref = useRef<number>(0);

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplay(value);
      return;
    }

    const start = ref.current;
    const end = value;
    const duration = 800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = end;
    };

    requestAnimationFrame(tick);
  }, [value]);

  return <>{display}</>;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: matchData, isLoading: matchesLoading } = useMatchHistory(user?.id || '', 1);
  const { data: friendsData, isLoading: friendsLoading } = useFriends();
  const { isUserOnline } = usePresence();

  const matchPayload = matchData?.data as Record<string, unknown> | undefined;
  const matchList = (matchPayload && Array.isArray((matchPayload as Record<string, unknown>).data)
    ? (matchPayload as Record<string, unknown>).data
    : matchPayload) as Record<string, unknown>[] | undefined;
  const recentMatches = Array.isArray(matchList) ? matchList.slice(0, 4) : [];

  const friendList = (friendsData?.data ?? []) as unknown as Record<string, unknown>[];
  const onlineFriends = friendList.filter((f) =>
    isUserOnline(String(f.userId || f._id || f.id || ''))
  );

  const winRate = user?.gamesPlayed
    ? Math.round(((user?.wins || 0) / user.gamesPlayed) * 100)
    : 0;

  const stats = [
    { label: 'Games Played', value: user?.gamesPlayed || 0, icon: Gamepad2, iconColor: 'text-primary-500' },
    { label: 'Wins', value: user?.wins || 0, icon: Trophy, iconColor: 'text-theme-success' },
    { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, iconColor: 'text-primary-400' },
    { label: 'ELO Rating', value: user?.elo || 1000, icon: Star, iconColor: 'text-theme-warning' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="page-heading">
                Welcome back,{' '}
                <span className="gradient-text">{user?.username || 'Player'}</span>
              </h1>
              <p className="text-theme-muted mt-2 text-base">Ready for your next challenge?</p>
            </div>
            <Link href="/games" className="w-full md:w-auto">
              <Button size="lg" leftIcon={<Play className="w-4 h-4" />} className="w-full md:w-auto">
                Quick Play
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {stats.map((stat, i) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={<AnimatedCounter value={stat.value} />}
              icon={stat.icon}
              iconColor={stat.iconColor}
              delay={i * 0.08}
            />
          ))}
        </div>

        <Card delay={0.35}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="p-3 rounded-2xl bg-primary-500/15 border border-primary-500/20"
              >
                <Zap className="w-5 h-5 text-primary-500" />
              </motion.div>
              <div>
                <p className="text-base font-semibold text-theme-primary font-display">
                  Level {user?.level || 1}
                </p>
                <p className="text-sm text-theme-muted">
                  {user?.xp || 0} / {user?.xpToNextLevel || 1000} XP
                </p>
              </div>
            </div>
            <RankBadge rank={user?.rank || 'bronze'} />
          </div>
          <ProgressBar value={user?.xp || 0} max={user?.xpToNextLevel || 1000} variant="primary" size="lg" />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <Card delay={0.4}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-theme-primary font-display">
                  Recent Matches
                </h3>
                <Link
                  href="/profile"
                  className="text-sm text-primary-500 hover:text-primary-400 font-medium transition-colors"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {matchesLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-2xl bg-theme-secondary border border-theme"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-2.5 h-2.5 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))
                ) : recentMatches.length > 0 ? (
                  recentMatches.map((match: Record<string, unknown>, i) => {
                    const matchId = (match._id || match.id) as string;
                    const players = (match.players || []) as Array<{
                      userId: string;
                      username: string;
                      result?: string;
                      eloChange?: number;
                    }>;
                    const opponent = players.find((p) => p.userId !== user?.id);
                    const me = players.find((p) => p.userId === user?.id);
                    const result =
                      me?.result ||
                      (match.winner === user?.id ? 'win' : match.winner ? 'loss' : 'draw');
                    const eloChange = me?.eloChange || 0;
                    return (
                      <motion.div
                        key={matchId}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-theme-secondary border border-theme hover:border-primary-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              result === 'win'
                                ? 'bg-theme-success'
                                : result === 'loss'
                                  ? 'bg-theme-danger'
                                  : 'bg-theme-warning'
                            }`}
                          />
                          <div>
                            <p className="text-sm font-medium text-theme-primary">
                              {(match.gameType as string) || 'Game'}
                            </p>
                            <p className="text-xs text-theme-muted">
                              vs {opponent?.username || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${
                              eloChange > 0
                                ? 'text-theme-success'
                                : eloChange < 0
                                  ? 'text-theme-danger'
                                  : 'text-theme-muted'
                            }`}
                          >
                            {eloChange > 0 ? '+' : ''}
                            {eloChange} ELO
                          </p>
                          <p className="text-xs text-theme-muted">
                            {match.createdAt
                              ? formatRelativeTime(match.createdAt as string)
                              : ''}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={<Gamepad2 className="w-9 h-9 text-theme-muted" />}
                    title="No matches yet"
                    description="Start playing to build your match history and climb the ranks."
                    action={{ label: 'Find a Game', onClick: () => window.location.assign('/games') }}
                  />
                )}
              </div>
            </Card>
          </div>

          <Card delay={0.45}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-theme-primary font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                Online Friends
              </h3>
              <Badge variant="success">{onlineFriends.length}</Badge>
            </div>
            <div className="space-y-2">
              {friendsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-20 mb-1.5" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))
              ) : onlineFriends.length > 0 ? (
                onlineFriends.slice(0, 5).map((friend: Record<string, unknown>, i) => {
                  const friendId = (friend._id || friend.userId || friend.id) as string;
                  const friendName = (friend.username || 'Player') as string;
                  return (
                    <motion.div
                      key={friendId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-primary-500/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={friendName} size="sm" online />
                        <div>
                          <p className="text-sm font-medium text-theme-primary">{friendName}</p>
                          <p className="text-xs text-theme-success">Online</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <p className="text-center text-sm text-theme-muted py-6">No friends online</p>
              )}
            </div>
            <Link
              href="/friends"
              className="block mt-5 text-center text-sm text-primary-500 hover:text-primary-400 font-medium transition-colors"
            >
              View All Friends
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
