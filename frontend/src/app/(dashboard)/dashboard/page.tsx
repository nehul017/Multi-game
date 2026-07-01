'use client';

import { motion } from 'framer-motion';
import { Gamepad2, Trophy, TrendingUp, Star, Zap, Play, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, RankBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/auth.store';
import { useMatchHistory, useFriends } from '@/hooks';
import { usePresence } from '@/socket/hooks';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

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

  const stats = [
    { label: 'Games Played', value: user?.gamesPlayed || 0, icon: Gamepad2, color: 'text-primary-400' },
    { label: 'Wins', value: user?.wins || 0, icon: Trophy, color: 'text-accent-green' },
    { label: 'Win Rate', value: `${user?.gamesPlayed ? Math.round(((user?.wins || 0) / user.gamesPlayed) * 100) : 0}%`, icon: TrendingUp, color: 'text-secondary-400' },
    { label: 'ELO Rating', value: user?.elo || 1000, icon: Star, color: 'text-yellow-400' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Welcome back, <span className="gradient-text">{user?.username || 'Player'}</span>
              </h1>
              <p className="text-gray-400 mt-1">Ready for your next challenge?</p>
            </div>
            <Link href="/games">
              <Button leftIcon={<Play className="w-4 h-4" />}>Quick Play</Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-surface-light ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Level & XP */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/20">
                <Zap className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Level {user?.level || 1}</p>
                <p className="text-xs text-gray-400">
                  {user?.xp || 0} / {user?.xpToNextLevel || 1000} XP
                </p>
              </div>
            </div>
            <RankBadge rank={user?.rank || 'bronze'} />
          </div>
          <ProgressBar value={user?.xp || 350} max={user?.xpToNextLevel || 1000} variant="primary" />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Matches */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Matches</h3>
                <Link href="/profile" className="text-sm text-primary-400 hover:text-primary-300">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {matchesLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-light/50">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-2 h-2 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16 mb-1" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))
                ) : recentMatches.length > 0 ? (
                  recentMatches.map((match: Record<string, unknown>) => {
                    const matchId = (match._id || match.id) as string;
                    const players = (match.players || []) as Array<{ userId: string; username: string; result?: string; eloChange?: number }>;
                    const opponent = players.find((p) => p.userId !== user?.id);
                    const me = players.find((p) => p.userId === user?.id);
                    const result = me?.result || (match.winner === user?.id ? 'win' : match.winner ? 'loss' : 'draw');
                    const eloChange = me?.eloChange || 0;
                    return (
                      <div key={matchId} className="flex items-center justify-between p-3 rounded-xl bg-surface-light/50 hover:bg-surface-light transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${result === 'win' ? 'bg-green-400' : result === 'loss' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                          <div>
                            <p className="text-sm font-medium text-white">{(match.gameType as string) || 'Game'}</p>
                            <p className="text-xs text-gray-400">vs {opponent?.username || 'Unknown'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${eloChange > 0 ? 'text-green-400' : eloChange < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                            {eloChange > 0 ? '+' : ''}{eloChange} ELO
                          </p>
                          <p className="text-xs text-gray-500">{match.createdAt ? formatRelativeTime(match.createdAt as string) : ''}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Gamepad2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No matches yet. Start playing!</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Online Friends */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-400" />
                Online Friends
              </h3>
              <Badge variant="success">{onlineFriends.length}</Badge>
            </div>
            <div className="space-y-3">
              {friendsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))
              ) : onlineFriends.length > 0 ? (
                onlineFriends.slice(0, 5).map((friend: Record<string, unknown>) => {
                  const friendId = (friend._id || friend.userId || friend.id) as string;
                  const friendName = (friend.username || 'Player') as string;
                  return (
                    <div key={friendId} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-light/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar name={friendName} size="sm" online />
                        <div>
                          <p className="text-sm font-medium text-white">{friendName}</p>
                          <p className="text-xs text-gray-400">Online</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-500">No friends online</p>
                </div>
              )}
            </div>
            <Link href="/friends" className="block mt-4 text-center text-sm text-primary-400 hover:text-primary-300">
              View All Friends
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
