'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Users, Trophy, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GamesBreadcrumb } from '@/components/games/GamesBreadcrumb';
import { formatGameTitle } from '@/types/home';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Table } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useGame, useGameRooms, useCreateRoom, useLeaderboard } from '@/hooks';
import { CoilRushApp } from '@/games/coil-rush/CoilRushApp';
import { ChessApp } from '@/games/chess-arena';
import { BlockMasterApp } from '@/games/block-master';
import { FruitSlotsApp } from '@/games/classic-fruit-slots';
import { PokerApp } from '@/games/poker';
import { MindiApp } from '@/games/mindi';
import { PuzzleWorldApp } from '@/games/puzzle-world';
import { JigsawWorldApp } from '@/games/jigsaw-world';
import { BottleShooterApp } from '@/games/bottle-shooter-3d';
import { CarromApp } from '@/games/carrom';
const slugIcons: Record<string, string> = {
  'tic-tac-toe': '⭕',
  'connect-four': '🔴',
  'chess': '♟️',
  'snake-multiplayer': '🐍',
  'coil-rush': '🐍',
  'ludo': '🎲',
  'quiz-battle': '🧠',
  'block-master': '🧱',
  'classic-fruit-slots': '🍒',
  poker: '♠',
  mindi: '🃏',
  'puzzle-world': '🧩',
  'jigsaw-world': '🧩',
  'bottle-shooter-3d': '🎯',
  carrom: '⚪',
};

interface RoomItem {
  _id?: string;
  id?: string;
  roomId?: string;
  name?: string;
  gameType?: string;
  host?: string;
  hostUsername?: string;
  players?: Array<{ userId?: { username?: string } | string; username?: string }>;
  maxPlayers?: number;
  status: string;
  elo?: string | number;
}

interface LeaderboardPlayer {
  rank: number;
  username: string;
  elo: number;
  userId?: string;
}

export default function GameDetailRoute() {
  const params = useParams();
  const slug = params.slug as string;

  if (slug === 'snake-multiplayer' || slug === 'coil-rush') {
    return <CoilRushApp variant="hub" />;
  }
  if (slug === 'chess') {
    return <ChessApp variant="hub" />;
  }
  if (slug === 'block-master') {
    return <BlockMasterApp variant="hub" />;
  }
  if (slug === 'classic-fruit-slots') {
    return <FruitSlotsApp variant="hub" />;
  }
  if (slug === 'poker') {
    return <PokerApp variant="hub" />;
  }
  if (slug === 'mindi') {
    return <MindiApp variant="hub" />;
  }
  if (slug === 'puzzle-world') {
    return <PuzzleWorldApp variant="hub" />;
  }
  if (slug === 'jigsaw-world') {
    return <JigsawWorldApp variant="hub" />;
  }
  if (slug === 'bottle-shooter-3d') {
    return <BottleShooterApp variant="hub" />;
  }
  if (slug === 'carrom') {
    return <CarromApp variant="hub" />;
  }

  return <GenericGameDetailPage slug={slug} />;
}

function GenericGameDetailPage({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState('rooms');

  const { data: gameData, isLoading: gameLoading, isError: gameError, refetch: refetchGame } = useGame(slug);
  const { data: roomsData, isLoading: roomsLoading } = useGameRooms(slug);
  const { data: lbData, isLoading: lbLoading } = useLeaderboard('all', slug, 1);
  const createRoom = useCreateRoom();

  const gamePayload = gameData?.data as unknown;
  const game = (gamePayload && typeof gamePayload === 'object' ? gamePayload : null) as Record<string, unknown> | null;
  const roomsPayload = roomsData?.data as unknown;
  const rooms: RoomItem[] = (Array.isArray(roomsPayload) ? roomsPayload : (roomsPayload as Record<string, unknown>)?.data ?? []) as RoomItem[];
  const lbPayload = lbData?.data as unknown;
  const leaderboard: LeaderboardPlayer[] = (Array.isArray(lbPayload) ? lbPayload : (lbPayload as Record<string, unknown>)?.data ?? []) as LeaderboardPlayer[];

  const icon = slugIcons[slug] || '🎮';
  const gameName = (game?.name as string) || formatGameTitle(slug);
  const gameDescription = (game?.description as string) || '';
  const category = (game?.category as string) || 'Game';

  const tabs = [
    { id: 'rooms', label: 'Rooms', count: rooms.length },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'rules', label: 'Rules' },
  ];

  const handleCreateRoom = () => {
    createRoom.mutate({
      gameSlug: slug,
      data: { name: `${gameName} Room`, isPrivate: false, maxPlayers: slug === 'snake-multiplayer' ? 4 : 2 },
    });
  };

  const columns = [
    { key: 'name', label: 'Room', render: (item: Record<string, unknown>) => {
      const gameType = (item.gameType as string) || slug;
      const name = (item.name as string) || `${gameType.replace(/-/g, ' ')} Room`;
      return <span className="font-medium text-theme-primary">{name}</span>;
    }},
    { key: 'host', label: 'Host', render: (item: Record<string, unknown>) => {
      const players = (item.players as RoomItem['players']) || [];
      const hostPlayer = players[0];
      const hostName =
        (item.hostUsername as string) ||
        (item.host as string) ||
        (typeof hostPlayer?.userId === 'object' ? hostPlayer.userId?.username : undefined) ||
        hostPlayer?.username ||
        'Host';
      return (
      <div className="flex items-center gap-2">
        <Avatar name={hostName} size="xs" />
        <span>{hostName}</span>
      </div>
    )}},
    { key: 'players', label: 'Players', render: (item: Record<string, unknown>) => {
      const playersList = (item.players as unknown[]) || [];
      const max = (item.maxPlayers as number) || (slug === 'snake-multiplayer' ? 4 : 2);
      return <span>{playersList.length}/{max}</span>;
    }},
    { key: 'status', label: 'Status', render: (item: Record<string, unknown>) => (
      <Badge variant={(item.status as string) === 'waiting' ? 'success' : 'warning'}>
        {item.status as string}
      </Badge>
    )},
    { key: 'action', label: '', render: (item: Record<string, unknown>) => {
      const roomId = (item.roomId || item.id || item._id) as string;
      const playersList = (item.players as unknown[]) || [];
      const max = (item.maxPlayers as number) || (slug === 'snake-multiplayer' ? 4 : 2);
      const status = item.status as string;
      const canJoin =
        status === 'waiting' ||
        (slug === 'snake-multiplayer' && status === 'playing' && playersList.length < max);
      return canJoin ? (
        <Link href={`/games/${slug}/play?room=${roomId}`}>
          <Button size="sm" variant="primary">{status === 'playing' ? 'Join Live' : 'Join'}</Button>
        </Link>
      ) : (
        <Button size="sm" variant="ghost">Spectate</Button>
      );
    }},
  ];

  if (gameLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <GamesBreadcrumb current={gameName} />
          <Card className="bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/20">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64 mb-2" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (gameError) {
    return (
      <DashboardLayout>
        <div className="mb-4">
          <GamesBreadcrumb current={gameName} />
        </div>
        <div className="text-center py-20">
          <p className="text-theme-muted mb-4">Failed to load game details</p>
          <Button variant="outline" onClick={() => refetchGame()} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4">
            <GamesBreadcrumb current={gameName} />
          </div>

          <Card className="bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{icon}</span>
                <div>
                  <h1 className="text-2xl font-bold text-theme-primary">{gameName}</h1>
                  <p className="text-theme-muted mt-1">{gameDescription}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="info">{category}</Badge>
                    <div className="flex items-center gap-1 text-xs text-theme-muted">
                      <Users className="w-3 h-3" /> {(game?.minPlayers as number) || 2}-{(game?.maxPlayers as number) || 2} players
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  leftIcon={createRoom.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  onClick={handleCreateRoom}
                  disabled={createRoom.isPending}
                >
                  Create Room
                </Button>
                <Link href={`/games/${slug}/play`}>
                  <Button leftIcon={<Play className="w-4 h-4" />}>
                    Quick Match
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'rooms' && (
          <>
            {roomsLoading ? (
              <Card>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-surface-light/50">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-8 w-16 ml-auto" />
                    </div>
                  ))}
                </div>
              </Card>
            ) : rooms.length > 0 ? (
              <Table columns={columns} data={rooms as unknown as Record<string, unknown>[]} emptyMessage="No rooms available" />
            ) : (
              <EmptyState
                icon={<Users className="w-8 h-8 text-theme-muted" />}
                title="No rooms available"
                description="Create a room or use Quick Match to start playing"
              />
            )}
          </>
        )}

        {activeTab === 'leaderboard' && (
          <Card>
            <h3 className="text-lg font-semibold text-theme-primary mb-4">Top Players - {gameName}</h3>
            <div className="space-y-3">
              {lbLoading && Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-surface-light/50">
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                </div>
              ))}
              {!lbLoading && leaderboard.length === 0 && (
                <div className="text-center py-8">
                  <Trophy className="w-8 h-8 text-theme-muted mx-auto mb-2" />
                  <p className="text-sm text-theme-muted">No leaderboard data yet</p>
                </div>
              )}
              {!lbLoading && leaderboard.slice(0, 10).map((player) => (
                <div key={player.rank} className="flex items-center gap-4 p-3 rounded-xl bg-surface-light/50">
                  <span className={`text-lg font-bold ${player.rank <= 3 ? 'text-yellow-400' : 'text-theme-muted'}`}>#{player.rank}</span>
                  <Avatar name={player.username} size="sm" />
                  <span className="text-sm font-medium text-theme-primary">{player.username}</span>
                  <span className="text-sm text-theme-muted ml-auto">{player.elo} ELO</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'rules' && (
          <Card>
            <h3 className="text-lg font-semibold text-theme-primary mb-4">How to Play</h3>
            <div className="prose prose-invert prose-sm max-w-none">
              {game?.rules ? (
                <p className="text-theme-muted">{game.rules as string}</p>
              ) : (
                <p className="text-theme-muted">Rules for {gameName} will be displayed here.</p>
              )}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
