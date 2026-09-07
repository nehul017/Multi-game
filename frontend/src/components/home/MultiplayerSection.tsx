'use client';

import { useRouter } from 'next/navigation';
import { GameShelf } from '@/components/home/GameShelf';
import { MultiplayerBanner } from '@/components/home/MultiplayerBanner';
import type { HomeGame, HomeMultiplayerStats } from '@/types/home';

interface MultiplayerSectionProps {
  games: HomeGame[];
  stats: HomeMultiplayerStats;
  isLoading?: boolean;
}

export function MultiplayerSection({ games, stats, isLoading }: MultiplayerSectionProps) {
  const router = useRouter();

  return (
    <div>
      <MultiplayerBanner stats={stats} />
      <GameShelf
        id="multiplayer-games"
        games={games}
        badge={(game) => {
          if (game.maxPlayers && game.maxPlayers >= 4) return `${game.maxPlayers} PLAYERS`;
          if (game.maxPlayers === 2) return '2 PLAYERS';
          return game.isMultiplayer ? 'MULTIPLAYER' : undefined;
        }}
        isLoading={isLoading}
        emptyAction={() => router.push('/games')}
      />
    </div>
  );
}
