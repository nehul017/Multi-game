'use client';

import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTournament, useJoinTournament } from '@/hooks';
import { useAuthStore } from '@/store/auth.store';
import { formatDate } from '@/lib/utils';

interface TournamentData {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  gameType?: string;
  gameName?: string;
  status: string;
  maxParticipants: number;
  participants: Array<{ userId?: string; _id?: string; username: string; avatar?: string; elo?: number; seed?: number }>;
  brackets?: Array<{ round: number; matches: Array<{ _id?: string; id?: string; player1?: { username: string }; player2?: { username: string }; winner?: string; score?: string; status?: string }> }>;
  startDate?: string;
  prize?: string;
  format?: string;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'default' }> = {
  'in-progress': { label: 'In Progress', variant: 'success' },
  registration: { label: 'Open', variant: 'warning' },
  upcoming: { label: 'Upcoming', variant: 'info' },
  finished: { label: 'Finished', variant: 'default' },
};

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const { user } = useAuthStore();
  const { data: tournamentRes, isLoading, isError, refetch } = useTournament(tournamentId);
  const joinTournament = useJoinTournament();

  const tournament = (tournamentRes?.data || null) as unknown as TournamentData | null;
  const isParticipant = tournament?.participants?.some((p) => (p.userId || p._id) === user?.id);
  const statusInfo = statusConfig[tournament?.status || ''] || { label: tournament?.status, variant: 'default' as const };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card><Skeleton className="h-24 w-full" /></Card>
          <Card><Skeleton className="h-48 w-full" /></Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !tournament) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">Failed to load tournament</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  const brackets = tournament.brackets || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/tournaments" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Tournaments
          </Link>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-primary-500/10 border-yellow-500/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Trophy className="w-7 h-7 text-yellow-400" />
                  {tournament.name}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" /> {tournament.participants?.length || 0}/{tournament.maxParticipants} players
                  </span>
                  {tournament.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {formatDate(tournament.startDate)}
                    </span>
                  )}
                  {tournament.prize && (
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-yellow-400" /> {tournament.prize}
                    </span>
                  )}
                </div>
              </div>
              {tournament.status === 'registration' && !isParticipant && (
                <Button
                  onClick={() => joinTournament.mutate(tournamentId)}
                  isLoading={joinTournament.isPending}
                >
                  Join Tournament
                </Button>
              )}
              {isParticipant && (
                <Badge variant="success">Joined</Badge>
              )}
            </div>
          </Card>
        </motion.div>

        {brackets.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-white mb-6">Tournament Bracket</h3>
            <div className="overflow-x-auto">
              <div className="flex gap-8 min-w-[600px] pb-4">
                {brackets.map((round) => (
                  <div key={round.round} className="flex-1 min-w-[180px]">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-4 text-center">
                      {round.round === brackets.length ? 'Final' : `Round ${round.round}`}
                    </h4>
                    <div className="space-y-4 flex flex-col justify-around h-full">
                      {round.matches.map((match, idx) => {
                        const p1Name = match.player1?.username || 'TBD';
                        const p2Name = match.player2?.username || 'TBD';
                        return (
                          <div key={match._id || match.id || idx} className="bg-surface-light/50 rounded-xl border border-surface-lighter/30 overflow-hidden">
                            <div className={`flex items-center gap-2 px-3 py-2 ${match.winner === p1Name ? 'bg-green-500/10' : ''}`}>
                              <Avatar name={p1Name} size="xs" />
                              <span className="text-xs font-medium text-white flex-1">{p1Name}</span>
                              {match.winner === p1Name && <span className="text-xs text-green-400">W</span>}
                            </div>
                            <div className="border-t border-surface-lighter/30" />
                            <div className={`flex items-center gap-2 px-3 py-2 ${match.winner === p2Name ? 'bg-green-500/10' : ''}`}>
                              <Avatar name={p2Name} size="xs" />
                              <span className="text-xs font-medium text-white flex-1">{p2Name}</span>
                              {match.winner === p2Name && <span className="text-xs text-green-400">W</span>}
                            </div>
                            {match.score && (
                              <div className="px-3 py-1 bg-surface-light text-center">
                                <span className="text-[10px] text-gray-400">{match.score}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Participants</h3>
          {tournament.participants?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tournament.participants.map((participant, i) => (
                <div key={participant._id || participant.userId || i} className="flex items-center gap-2 p-2 rounded-lg bg-surface-light/30">
                  <Avatar name={participant.username} src={participant.avatar} size="sm" />
                  <div>
                    <p className="text-xs font-medium text-white">{participant.username}</p>
                    <p className="text-[10px] text-gray-400">
                      {participant.seed ? `Seed #${participant.seed}` : `${participant.elo || 1000} ELO`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No participants yet</p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
