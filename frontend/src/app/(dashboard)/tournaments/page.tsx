'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, Gamepad2, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTournaments, useJoinTournament } from '@/hooks';

interface TournamentItem {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  gameType?: string;
  gameName?: string;
  status: string;
  maxParticipants: number;
  participants?: unknown[];
  currentParticipants?: number;
  startDate: string;
  prize?: string;
  format?: string;
}

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState('all');

  const statusFilter = activeTab === 'all' ? undefined : activeTab === 'active' ? 'in-progress' : activeTab;
  const { data, isLoading, isError, refetch } = useTournaments(1, statusFilter);
  const joinTournament = useJoinTournament();

  const tournaments: TournamentItem[] = (data?.data?.data || data?.data || []) as TournamentItem[];

  const filtered = activeTab === 'all' ? tournaments : activeTab === 'active'
    ? tournaments.filter((t) => ['in-progress', 'registration'].includes(t.status))
    : tournaments;

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'finished', label: 'Finished' },
  ];

  const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'default' }> = {
    'in-progress': { label: 'In Progress', variant: 'success' },
    registration: { label: 'Open', variant: 'warning' },
    upcoming: { label: 'Upcoming', variant: 'info' },
    finished: { label: 'Finished', variant: 'default' },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-theme-primary flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                Tournaments
              </h1>
              <p className="text-theme-muted mt-1">Compete in organized tournaments</p>
            </div>
          </div>
        </motion.div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {isError && (
          <div className="text-center py-12">
            <p className="text-theme-muted mb-4">Failed to load tournaments</p>
            <Button variant="outline" onClick={() => refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Retry
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface/80 border border-surface-lighter/50 rounded-2xl p-6 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((tournament, i) => {
              const tournamentId = tournament._id || tournament.id || '';
              const participantCount = tournament.currentParticipants ?? tournament.participants?.length ?? 0;
              const sConfig = statusConfig[tournament.status] || { label: tournament.status, variant: 'default' as const };
              return (
                <motion.div
                  key={tournamentId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card hover>
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant={sConfig.variant}>
                        {sConfig.label}
                      </Badge>
                      <span className="text-xs text-theme-muted flex items-center gap-1">
                        <Gamepad2 className="w-3 h-3" /> {tournament.gameType || tournament.gameName || 'Game'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-theme-primary mb-2">{tournament.name}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-theme-muted">
                        <Users className="w-4 h-4" />
                        <span>{participantCount}/{tournament.maxParticipants} players</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-theme-muted">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                      </div>
                      {tournament.prize && (
                        <div className="flex items-center gap-2 text-sm text-theme-muted">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                          <span>{tournament.prize}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/tournaments/${tournamentId}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      {tournament.status === 'registration' && (
                        <Button
                          size="sm"
                          onClick={() => joinTournament.mutate(tournamentId)}
                          disabled={joinTournament.isPending}
                        >
                          Join
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            icon={<Trophy className="w-8 h-8 text-theme-muted" />}
            title="No tournaments"
            description="No tournaments found for this filter. Check back later!"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
