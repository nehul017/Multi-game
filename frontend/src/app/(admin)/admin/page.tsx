'use client';

import { motion } from 'framer-motion';
import { Users, Gamepad2, Trophy, Activity, TrendingUp, Server } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAdminDashboard, useServerHealth } from '@/hooks';

export default function AdminDashboard() {
  const { data: dashboardRes, isLoading, isError, refetch } = useAdminDashboard();
  const { data: healthRes } = useServerHealth();

  const stats = dashboardRes?.data;
  const health = healthRes?.data;

  if (isError) {
    return (
      <AdminLayout>
        <ErrorState title="Failed to load dashboard" message="Could not fetch dashboard data." onRetry={refetch} />
      </AdminLayout>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers?.toLocaleString() ?? '—', icon: Users, color: 'text-blue-400' },
    { label: 'Active Users', value: stats?.activeUsers?.toLocaleString() ?? '—', icon: Activity, color: 'text-green-400' },
    { label: 'Online Now', value: stats?.onlineNow?.toLocaleString() ?? '—', icon: TrendingUp, color: 'text-cyan-400' },
    { label: 'Running Matches', value: stats?.runningMatches?.toLocaleString() ?? '—', icon: Gamepad2, color: 'text-purple-400' },
    { label: 'Total Matches', value: stats?.totalMatches?.toLocaleString() ?? '—', icon: Trophy, color: 'text-yellow-400' },
    { label: 'Server Health', value: health?.status === 'healthy' ? '99.9%' : health?.status ?? '—', icon: Server, color: 'text-green-400' },
  ];

  const dauData = stats?.dailyActiveUsers ?? [];
  const maxDau = Math.max(...dauData.map((d) => d.count), 1);

  const gamesDistribution = stats?.gamesDistribution ?? [];
  const totalDistribution = gamesDistribution.reduce((sum, g) => sum + g.value, 0) || 1;

  const distributionColors = ['bg-purple-500', 'bg-cyan-500', 'bg-orange-500', 'bg-green-500', 'bg-pink-500'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Platform overview and management</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface/80 border border-surface-lighter/50 rounded-2xl p-6 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))
            : statCards.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                      </div>
                      <div className={`p-2 rounded-lg bg-surface-light ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Active Users Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Daily Active Users</h3>
            <div className="h-48 flex items-center justify-center bg-surface-light/30 rounded-xl">
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : dauData.length === 0 ? (
                <p className="text-sm text-gray-500">No data available</p>
              ) : (
                <div className="flex items-end gap-2 h-32 px-2 w-full justify-center">
                  {dauData.slice(-12).map((d, i) => (
                    <motion.div
                      key={d.date}
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.count / maxDau) * 100}%` }}
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                      className="w-6 bg-gradient-to-t from-primary-600 to-primary-400 rounded-t"
                      title={`${d.date}: ${d.count}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Games Distribution */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Games Distribution</h3>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : gamesDistribution.length === 0 ? (
              <p className="text-sm text-gray-500">No games data</p>
            ) : (
              <div className="space-y-3">
                {gamesDistribution.map((item, idx) => {
                  const percentage = Math.round((item.value / totalDistribution) * 100);
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-300">{item.name}</span>
                        <span className="text-gray-400">{percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8 }}
                          className={`h-full rounded-full ${distributionColors[idx % distributionColors.length]}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Summary Stats */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-surface-light/50 text-center">
                <p className="text-xs text-gray-400">New Users Today</p>
                <p className="text-lg font-bold text-white">{stats?.newUsersToday ?? 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-light/50 text-center">
                <p className="text-xs text-gray-400">Matches Today</p>
                <p className="text-lg font-bold text-white">{stats?.matchesToday ?? 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-light/50 text-center">
                <p className="text-xs text-gray-400">Total Games</p>
                <p className="text-lg font-bold text-white">{stats?.totalGames ?? 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-light/50 text-center">
                <p className="text-xs text-gray-400">Total Tournaments</p>
                <p className="text-lg font-bold text-white">{stats?.totalTournaments ?? 0}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
