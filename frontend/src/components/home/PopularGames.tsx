'use client';

import { useRouter } from 'next/navigation';
import { GameShelf } from '@/components/home/GameShelf';
import type { HomeGame } from '@/types/home';

interface PopularGamesProps {
  games: HomeGame[];
  isLoading?: boolean;
}

export function PopularGames({ games, isLoading }: PopularGamesProps) {
  const router = useRouter();

  return (
    <GameShelf
      id="popular"
      title="⭐ Popular Games"
      href="/games?filter=popular"
      games={games}
      isLoading={isLoading}
      emptyAction={() => router.push('/games')}
    />
  );
}
