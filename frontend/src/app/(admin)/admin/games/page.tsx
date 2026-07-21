'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Plus, Settings, Users } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAdminGames } from '@/hooks';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

const INITIAL_FORM = {
  name: '',
  slug: '',
  description: '',
  category: '',
  minPlayers: '2',
  maxPlayers: '2',
  thumbnail: '',
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type GameModalMode = 'create' | 'edit';

export default function AdminGamesPage() {
  const [gameModal, setGameModal] = useState<{ mode: GameModalMode; gameId?: string } | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const { data: gamesRes, isLoading, isError, refetch } = useAdminGames();
  const queryClient = useQueryClient();

  const closeGameModal = () => {
    setGameModal(null);
    setFormData(INITIAL_FORM);
  };

  const openCreateModal = () => {
    setFormData(INITIAL_FORM);
    setGameModal({ mode: 'create' });
  };

  const openEditModal = (game: any) => {
    setFormData({
      name: game.name ?? '',
      slug: game.slug ?? '',
      description: game.description ?? '',
      category: game.category ?? '',
      minPlayers: String(game.minPlayers ?? 2),
      maxPlayers: String(game.maxPlayers ?? 2),
      thumbnail: game.thumbnail ?? '',
    });
    setGameModal({ mode: 'edit', gameId: game._id || game.id });
  };

  const createGame = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminService.createGame(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGames'] });
      toast.success('Game created');
      closeGameModal();
    },
    onError: () => toast.error('Failed to create game'),
  });

  const updateGame = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminService.updateGame(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGames'] });
      toast.success('Game updated');
      closeGameModal();
    },
    onError: () => toast.error('Failed to update game'),
  });

  const toggleGame = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminService.toggleGame(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGames'] });
      toast.success('Game status updated');
    },
    onError: () => toast.error('Failed to update game status'),
  });

  const rawData = gamesRes?.data as unknown;
  const games: any[] = Array.isArray(rawData)
    ? rawData
    : ((rawData as Record<string, unknown>)?.data as any[]) ?? [];

  const buildGamePayload = () => {
    const slug = formData.slug.trim() || slugify(formData.name);
    if (!formData.name.trim() || !slug || !formData.description.trim() || !formData.category) {
      toast.error('Please fill in all required fields');
      return null;
    }

    return {
      name: formData.name.trim(),
      slug,
      description: formData.description.trim(),
      category: formData.category,
      minPlayers: parseInt(formData.minPlayers, 10),
      maxPlayers: parseInt(formData.maxPlayers, 10),
      thumbnail: formData.thumbnail.trim() || undefined,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildGamePayload();
    if (!payload || !gameModal) return;

    if (gameModal.mode === 'create') {
      createGame.mutate({ ...payload, isActive: true });
      return;
    }

    if (gameModal.gameId) {
      updateGame.mutate({ id: gameModal.gameId, data: payload });
    }
  };

  const isSaving = createGame.isPending || updateGame.isPending;

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
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
              Add Game
            </Button>
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
              <EmptyState
                title="No games found"
                description="Add a new game to get started."
                action={{ label: 'Add Game', onClick: openCreateModal }}
              />
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

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    leftIcon={<Settings className="w-4 h-4" />}
                    onClick={() => openEditModal(game)}
                  >
                    Edit Settings
                  </Button>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        <Modal
          isOpen={gameModal !== null}
          onClose={closeGameModal}
          title={gameModal?.mode === 'edit' ? 'Edit Game Settings' : 'Add Game'}
          size="md"
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Game Name"
              placeholder="e.g., Chess"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  name,
                  slug: prev.slug || slugify(name),
                }));
              }}
              required
            />
            <Input
              label="Slug"
              placeholder="e.g., chess"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                className="w-full bg-surface border border-surface-lighter rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 hover:border-surface-lighter/80 min-h-[80px] resize-y"
                placeholder="Describe the game..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <Select
              label="Category"
              options={[
                { value: 'board', label: 'Board' },
                { value: 'arcade', label: 'Arcade' },
                { value: 'trivia', label: 'Trivia' },
                { value: 'strategy', label: 'Strategy' },
              ]}
              placeholder="Select a category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Min Players"
                type="number"
                min={1}
                value={formData.minPlayers}
                onChange={(e) => setFormData({ ...formData, minPlayers: e.target.value })}
                required
              />
              <Input
                label="Max Players"
                type="number"
                min={1}
                value={formData.maxPlayers}
                onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                required
              />
            </div>
            <Input
              label="Thumbnail URL (optional)"
              placeholder="/images/games/my-game.png"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={closeGameModal} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving
                  ? gameModal?.mode === 'edit'
                    ? 'Saving...'
                    : 'Creating...'
                  : gameModal?.mode === 'edit'
                    ? 'Save Changes'
                    : 'Create Game'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
