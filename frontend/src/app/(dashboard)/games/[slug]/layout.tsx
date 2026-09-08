import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { formatGameTitle } from '@/types/home';

const GAME_META: Record<string, Metadata> = {
  'block-master': {
    title: 'Block Master | Games',
    description: 'Stack, rotate, and clear under rising pressure in Block Master.',
  },
  'classic-fruit-slots': {
    title: 'Classic Fruit Slots | Games',
    description: 'Spin a classic 5-reel fruit slot machine with server-authoritative results.',
  },
};

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const extra = GAME_META[params.slug];
  if (extra) return extra;
  const name = formatGameTitle(params.slug);
  return {
    title: `${name} | Games`,
    description: `Play ${name} on GAMEHUB.`,
  };
}

export default function GameSlugLayout({ children }: { children: ReactNode }) {
  return children;
}
