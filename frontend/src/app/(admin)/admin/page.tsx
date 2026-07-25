'use client';

import { motion } from 'framer-motion';
import { Users, Gamepad2, Trophy, Activity, TrendingUp, Server } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, StatCard } from '@/components/ui/Card';
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
    { label: 'Total Users', value: stats?.totalUsers?.toLocaleString() ?? '—', icon: Users, iconColor: 'text-primary-400' },
    { label: 'Active Users', value: stats?.activeUsers?.toLocaleString() ?? '—', icon: Activity, iconColor: 'text-theme-success' },
    { label: 'Online Now', value: stats?.onlineNow?.toLocaleString() ?? '—', icon: TrendingUp, iconColor: 'text-primary-500' },
    { label: 'Running Matches', value: stats?.runningMatches?.toLocaleString() ?? '—', icon: Gamepad2, iconColor: 'text-primary-500' },
    { label: 'Total Matches', value: stats?.totalMatches?.toLocaleString() ?? '—', icon: Trophy, iconColor: 'text-theme-warning' },
    { label: 'Server Health', value: health?.status === 'healthy' ? 'Healthy' : health?.status ?? '—', icon: Server, iconColor: 'text-theme-success' },
  ];

  const dauData = stats?.dailyActiveUsers ?? [];
  const maxDau = Math.max(...dauData.map((d) => d.count), 1);

  const gamesDistribution = stats?.gamesDistribution ?? [];
  const totalDistribution = gamesDistribution.reduce((sum, g) => sum + g.value, 0) || 1;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-heading">Admin Dashboard</h1>
          <p className="text-theme-muted mt-2 text-base">Platform overview and management</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="surface-card p-4 sm:p-6 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-20" />
                </div>
              ))
            : statCards.map((stat, i) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  icon={stat.icon}
                  iconColor={stat.iconColor}
                  delay={i * 0.08}
                />
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <Card delay={0.5}>
            <h3 className="text-lg font-semibold text-theme-primary font-display mb-6">
              Daily Active Users
            </h3>
            <div className="h-52 flex items-end justify-center rounded-2xl bg-theme-secondary border border-theme p-3 sm:p-4 overflow-x-auto">
              {isLoading ? (
                <Skeleton className="h-32 w-full rounded-xl" />
              ) : dauData.length === 0 ? (
                <p className="text-sm text-theme-muted self-center">No data available</p>
              ) : (
                <div className="flex items-end gap-1.5 sm:gap-2.5 h-36 px-1 sm:px-2 w-full min-w-[280px] justify-center">
                  {dauData.slice(-12).map((d, i) => (
                    <motion.div
                      key={d.date}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: `${Math.max((d.count / maxDau) * 100, 4)}%`,
                        opacity: 1,
                      }}
                      transition={{ delay: i * 0.05, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="w-4 sm:w-7 chart-bar min-h-[4px] shadow-glow-purple shrink-0"
                      title={`${d.date}: ${d.count}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card delay={0.55}>
            <h3 className="text-lg font-semibold text-theme-primary font-display mb-6">
              Games Distribution
            </h3>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : gamesDistribution.length === 0 ? (
              <p className="text-sm text-theme-muted">No games data</p>
            ) : (
              <div className="space-y-4">
                {gamesDistribution.map((item, idx) => {
                  const percentage = Math.round((item.value / totalDistribution) * 100);
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-theme-primary font-medium">{item.name}</span>
                        <span className="text-theme-muted">{percentage}%</span>
                      </div>
                      <div className="progress-track h-2.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className="progress-fill h-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <Card delay={0.6}>
          <h3 className="text-lg font-semibold text-theme-primary font-display mb-6">Quick Stats</h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'New Users Today', value: stats?.newUsersToday ?? 0 },
                { label: 'Matches Today', value: stats?.matchesToday ?? 0 },
                { label: 'Total Games', value: stats?.totalGames ?? 0 },
                { label: 'Total Tournaments', value: stats?.totalTournaments ?? 0 },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-5 rounded-2xl bg-theme-secondary border border-theme text-center hover:border-primary-500/30 transition-colors"
                >
                  <p className="text-xs text-theme-muted mb-1">{item.label}</p>
                  <p className="text-2xl font-bold text-theme-primary font-display">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
