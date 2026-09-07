'use client';

import { useRouter } from 'next/navigation';
import { GameShelf } from '@/components/home/GameShelf';
import type { HomeGame } from '@/types/home';

interface TrendingGamesProps {
  games: HomeGame[];
  isLoading?: boolean;
}

export function TrendingGames({ games, isLoading }: TrendingGamesProps) {
  const router = useRouter();

  return (
    <GameShelf
      id="trending"
      title="🔥 Trending Games"
      href="/games"
      games={games}
      columns="trending"
      priorityCount={2}
      isLoading={isLoading}
      emptyAction={() => router.push('/games')}
    />
  );
}
