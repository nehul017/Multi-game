'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, Edit, Trash2, Users, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

export default function AdminTournamentsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', game: '', maxParticipants: '32', startDate: '', prize: '' });
  const queryClient = useQueryClient();

  const { data: tournamentsRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['adminTournaments'],
    queryFn: () => adminService.getTournaments(),
  });

  const createTournament = useMutation({
    mutationFn: (data: any) => adminService.createTournament(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTournaments'] });
      toast.success('Tournament created');
      setShowCreate(false);
      setFormData({ name: '', game: '', maxParticipants: '32', startDate: '', prize: '' });
    },
    onError: () => toast.error('Failed to create tournament'),
  });

  const deleteTournament = useMutation({
    mutationFn: (id: string) => adminService.deleteTournament(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTournaments'] });
      toast.success('Tournament deleted');
    },
    onError: () => toast.error('Failed to delete tournament'),
  });

  const tournaments: any[] = tournamentsRes?.data ?? [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createTournament.mutate({
      name: formData.name,
      game: formData.game,
      maxParticipants: parseInt(formData.maxParticipants),
      startDate: formData.startDate,
      prize: formData.prize,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete tournament "${name}"? This cannot be undone.`)) {
      deleteTournament.mutate(id);
    }
  };

  if (isError) {
    return (
      <AdminLayout>
        <ErrorState title="Failed to load tournaments" message="Could not fetch tournament data." onRetry={refetch} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Tournament Management</h1>
              <p className="text-gray-400 mt-1">Create and manage tournaments</p>
            </div>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
              Create Tournament
            </Button>
          </div>
        </motion.div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface/80 border border-surface-lighter/50 rounded-2xl p-6 flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))
          ) : tournaments.length === 0 ? (
            <EmptyState
              title="No tournaments"
              description="Create your first tournament to get started."
              action={{ label: 'Create Tournament', onClick: () => setShowCreate(true) }}
            />
          ) : (
            tournaments.map((tournament: any, i: number) => (
              <motion.div
                key={tournament._id || tournament.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{tournament.name}</h3>
                      <Badge variant={
                        tournament.status === 'in-progress' || tournament.status === 'active' ? 'success' :
                        tournament.status === 'registration' || tournament.status === 'upcoming' ? 'warning' : 'info'
                      }>
                        {tournament.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>{tournament.game?.name || tournament.game || '—'}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {tournament.participants?.length ?? tournament.currentParticipants ?? 0}/{tournament.maxParticipants ?? '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(tournament._id || tournament.id, tournament.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Tournament" size="md">
          <form className="space-y-4" onSubmit={handleCreate}>
            <Input
              label="Tournament Name"
              placeholder="Enter tournament name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Select
              label="Game"
              options={[
                { value: 'chess', label: 'Chess' },
                { value: 'tic-tac-toe', label: 'Tic Tac Toe' },
                { value: 'connect-four', label: 'Connect Four' },
              ]}
              placeholder="Select a game"
              value={formData.game}
              onChange={(e) => setFormData({ ...formData, game: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Participants"
                type="number"
                placeholder="32"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
              />
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <Input
              label="Prize"
              placeholder="e.g., Gold Badge + 500 XP"
              value={formData.prize}
              onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1" disabled={createTournament.isPending}>
                {createTournament.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
