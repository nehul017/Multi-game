'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trophy, Gamepad2, TrendingUp, Clock, Star } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, RankBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/auth.store';
import { useMatchHistory } from '@/hooks';
import { calculateWinRate, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

interface MatchItem {
  _id?: string;
  id?: string;
  gameType?: string;
  gameName?: string;
  players?: Array<{ userId: string; username: string; result?: string; eloChange?: number }>;
  winner?: string;
  status?: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const { data: matchData, isLoading: matchesLoading } = useMatchHistory(user?.id || '', 1);

  const matches: MatchItem[] = (matchData?.data?.data || matchData?.data || []) as MatchItem[];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'matches', label: 'Match History' },
    { id: 'achievements', label: 'Achievements' },
  ];

  const winRate = calculateWinRate(user?.wins || 0, user?.gamesPlayed || 1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary-600/20 to-secondary-600/20" />
            <div className="relative pt-16 flex flex-col md:flex-row items-start md:items-end gap-4">
              <Avatar src={user?.avatar} name={user?.username} size="xl" online />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{user?.username}</h1>
                  <RankBadge rank={user?.rank || 'bronze'} />
                </div>
                <p className="text-gray-400 text-sm mt-1">{user?.bio || 'No bio set'}</p>
              </div>
              <Link href="/settings">
                <Button variant="outline" size="sm" leftIcon={<Edit2 className="w-4 h-4" />}>
                  Edit Profile
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'ELO Rating', value: user?.elo || 1000, icon: Star, color: 'text-yellow-400' },
            { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, color: 'text-green-400' },
            { label: 'Games Played', value: user?.gamesPlayed || 0, icon: Gamepad2, color: 'text-primary-400' },
            { label: 'Wins', value: user?.wins || 0, icon: Trophy, color: 'text-secondary-400' },
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

        {/* Level Progress */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">Level {user?.level || 1}</span>
            <span className="text-xs text-gray-400">{user?.xp || 0} / {user?.xpToNextLevel || 1000} XP</span>
          </div>
          <ProgressBar value={user?.xp || 350} max={user?.xpToNextLevel || 1000} variant="primary" size="md" />
        </Card>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Wins</span>
                  <span className="text-sm font-semibold text-green-400">{user?.wins || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Losses</span>
                  <span className="text-sm font-semibold text-red-400">{user?.losses || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Draws</span>
                  <span className="text-sm font-semibold text-yellow-400">{user?.draws || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Win Rate</span>
                  <span className="text-sm font-semibold text-white">{winRate}%</span>
                </div>
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Member since</span>
                  <span className="text-white ml-auto">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Gamepad2 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Total Games</span>
                  <span className="text-white ml-auto">{user?.gamesPlayed || 0}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'matches' && (
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Match History</h3>
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
                <div className="text-center py-8">
                  <Gamepad2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No matches played yet</p>
                </div>
              )}
              {!matchesLoading && matches.map((match) => {
                const matchId = (match._id || match.id) as string;
                const players = match.players || [];
                const me = players.find((p) => p.userId === user?.id);
                const opponent = players.find((p) => p.userId !== user?.id);
                const result = me?.result || (match.winner === user?.id ? 'win' : match.winner ? 'loss' : 'draw');
                return (
                  <div key={matchId} className="flex items-center justify-between p-3 rounded-xl bg-surface-light/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${result === 'win' ? 'bg-green-400' : result === 'loss' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                      <div>
                        <p className="text-sm font-medium text-white">{match.gameType || match.gameName || 'Game'}</p>
                        <p className="text-xs text-gray-400">vs {opponent?.username || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={result === 'win' ? 'success' : result === 'loss' ? 'danger' : 'warning'}>
                        {result === 'win' ? 'Win' : result === 'loss' ? 'Loss' : 'Draw'}
                      </Badge>
                      {match.createdAt && (
                        <span className="text-xs text-gray-500">{formatRelativeTime(match.createdAt)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(user?.achievements || []).length > 0 ? (
              user!.achievements.map((achievement) => (
                <Card key={achievement.id} className={achievement.unlockedAt ? '' : 'opacity-50'}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{achievement.name}</p>
                      <p className="text-xs text-gray-400">{achievement.description}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Trophy className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No achievements yet. Keep playing to unlock them!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
