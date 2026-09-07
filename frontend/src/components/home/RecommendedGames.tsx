'use client';

import { useRouter } from 'next/navigation';
import { GameShelf } from '@/components/home/GameShelf';
import type { HomeGame } from '@/types/home';

interface RecommendedGamesProps {
  games: HomeGame[];
  isLoading?: boolean;
}

export function RecommendedGames({ games, isLoading }: RecommendedGamesProps) {
  const router = useRouter();

  return (
    <GameShelf
      id="recommended"
      title="🎯 Recommended For You"
      href="/games"
      games={games}
      isLoading={isLoading}
      emptyAction={() => router.push('/games')}
    />
  );
}
