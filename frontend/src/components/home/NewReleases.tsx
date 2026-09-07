'use client';

import { useRouter } from 'next/navigation';
import { GameShelf } from '@/components/home/GameShelf';
import type { HomeGame } from '@/types/home';

interface NewReleasesProps {
  games: HomeGame[];
  isLoading?: boolean;
}

export function NewReleases({ games, isLoading }: NewReleasesProps) {
  const router = useRouter();

  return (
    <GameShelf
      id="new"
      title="🆕 New Games"
      href="/games?filter=new"
      games={games}
      badge={() => 'NEW'}
      isLoading={isLoading}
      emptyAction={() => router.push('/games')}
    />
  );
}
