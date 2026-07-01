'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Gamepad2, TrendingUp, Star, UserPlus, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, RankBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useUserProfile, useMatchHistory, useSendFriendRequest } from '@/hooks';
import { calculateWinRate, formatRelativeTime } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface UserData {
  _id?: string;
  id?: string;
  username: string;
  avatar?: string;
  bio?: string;
  elo: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  rank: string;
  createdAt?: string;
}

interface MatchItem {
  _id?: string;
  id?: string;
  gameType?: string;
  players?: Array<{ userId: string; username: string; result?: string }>;
  winner?: string;
  createdAt?: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const { data: profileData, isLoading, isError, refetch } = useUserProfile(userId);
  const { data: matchData, isLoading: matchesLoading } = useMatchHistory(userId, 1);
  const sendRequest = useSendFriendRequest();

  const profilePayload = profileData?.data as unknown;
  const userData: UserData | null = (profilePayload ? (typeof profilePayload === 'object' && 'data' in (profilePayload as Record<string, unknown>) ? (profilePayload as Record<string, unknown>).data : profilePayload) : null) as UserData | null;
  const matchPayload = matchData?.data as unknown;
  const matches: MatchItem[] = (Array.isArray(matchPayload) ? matchPayload : (matchPayload as Record<string, unknown>)?.data ?? []) as MatchItem[];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary-600/20 to-secondary-600/20" />
            <div className="relative pt-16 flex items-end gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><Skeleton className="h-16 w-full" /></Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !userData) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">Failed to load profile</p>
          <Button variant="outline" onClick={() => refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const winRate = calculateWinRate(userData.wins || 0, userData.gamesPlayed || 1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary-600/20 to-secondary-600/20" />
            <div className="relative pt-16 flex flex-col md:flex-row items-start md:items-end gap-4">
              <Avatar src={userData.avatar} name={userData.username} size="xl" />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{userData.username}</h1>
                  <RankBadge rank={(userData.rank as 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster') || 'bronze'} />
                </div>
                <p className="text-gray-400 text-sm mt-1">{userData.bio || 'No bio set'}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={sendRequest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                onClick={() => sendRequest.mutate(userId)}
                disabled={sendRequest.isPending}
              >
                Add Friend
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'ELO Rating', value: userData.elo || 1000, icon: Star, color: 'text-yellow-400' },
            { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, color: 'text-green-400' },
            { label: 'Games Played', value: userData.gamesPlayed || 0, icon: Gamepad2, color: 'text-primary-400' },
            { label: 'Wins', value: userData.wins || 0, icon: Trophy, color: 'text-secondary-400' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Level */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">Level {userData.level || 1}</span>
            <span className="text-xs text-gray-400">{userData.xp || 0} / {userData.xpToNextLevel || 1000} XP</span>
          </div>
          <ProgressBar value={userData.xp || 0} max={userData.xpToNextLevel || 1000} variant="primary" size="md" />
        </Card>

        {/* Recent Matches */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Recent Matches</h3>
          <div className="space-y-3">
            {matchesLoading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-light/50">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
            {!matchesLoading && matches.length === 0 && (
              <EmptyState title="No matches" description="This player hasn't played any matches yet" />
            )}
            {!matchesLoading && matches.map((match) => {
              const matchId = (match._id || match.id) as string;
              const players = match.players || [];
              const targetPlayer = players.find((p) => p.userId === userId);
              const opponent = players.find((p) => p.userId !== userId);
              const result = targetPlayer?.result || (match.winner === userId ? 'win' : match.winner ? 'loss' : 'draw');
              return (
                <div key={matchId} className="flex items-center justify-between p-3 rounded-xl bg-surface-light/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${result === 'win' ? 'bg-green-400' : result === 'loss' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-white">{match.gameType || 'Game'}</p>
                      <p className="text-xs text-gray-400">vs {opponent?.username || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={result === 'win' ? 'success' : result === 'loss' ? 'danger' : 'warning'}>
                      {result === 'win' ? 'Win' : result === 'loss' ? 'Loss' : 'Draw'}
                    </Badge>
                    {match.createdAt && <span className="text-xs text-gray-500">{formatRelativeTime(match.createdAt)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
