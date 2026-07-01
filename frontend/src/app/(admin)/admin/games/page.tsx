'use client';

import { motion } from 'framer-motion';
import { Gamepad2, Settings, Users } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAdminGames } from '@/hooks';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

export default function AdminGamesPage() {
  const { data: gamesRes, isLoading, isError, refetch } = useAdminGames();
  const queryClient = useQueryClient();

  const toggleGame = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminService.toggleGame(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGames'] });
      toast.success('Game status updated');
    },
    onError: () => toast.error('Failed to update game status'),
  });

  const games: any[] = gamesRes?.data ?? [];

  if (isError) {
    return (
      <AdminLayout>
        <ErrorState title="Failed to load games" message="Could not fetch game data." onRetry={refetch} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Game Management</h1>
              <p className="text-gray-400 mt-1">Manage available games and their settings</p>
            </div>
            <Button leftIcon={<Gamepad2 className="w-4 h-4" />}>Add Game</Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface/80 border border-surface-lighter/50 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
                <Skeleton className="h-8 w-full" />
              </div>
            ))
          ) : games.length === 0 ? (
            <div className="col-span-full">
              <EmptyState title="No games found" description="Add a new game to get started." />
            </div>
          ) : (
            games.map((game: any, i: number) => (
              <motion.div
                key={game._id || game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{game.name}</h3>
                        <p className="text-xs text-gray-400">/{game.slug}</p>
                      </div>
                    </div>
                    <Switch
                      checked={game.isActive ?? true}
                      onChange={() => toggleGame.mutate({ id: game._id || game.id, isActive: !game.isActive })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-surface-light/50">
                      <p className="text-xs text-gray-400">Total Matches</p>
                      <p className="text-sm font-semibold text-white">
                        {game.totalMatches ? `${(game.totalMatches / 1000).toFixed(0)}K` : '0'}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-light/50">
                      <p className="text-xs text-gray-400">Online</p>
                      <p className="text-sm font-semibold text-green-400">{game.onlinePlayers ?? 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {game.minPlayers ?? 2}-{game.maxPlayers ?? 2} players
                    </span>
                    <Badge variant={game.isActive ? 'success' : 'danger'}>
                      {game.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>

                  <Button variant="outline" size="sm" className="w-full" leftIcon={<Settings className="w-4 h-4" />}>
                    Edit Settings
                  </Button>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
