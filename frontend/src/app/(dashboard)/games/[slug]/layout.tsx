import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { formatGameTitle } from '@/types/home';

const GAME_META: Record<string, Metadata> = {
  'coil-rush': {
    title: 'Coil Rush | Games',
    description: 'Grow your coil, outsmart rivals, and survive the arena.',
  },
  'snake-multiplayer': {
    title: 'Coil Rush | Games',
    description: 'Grow your coil, outsmart rivals, and survive the arena.',
  },
  'block-master': {
    title: 'Block Master | Games',
    description: 'Stack, rotate, and clear under rising pressure in Block Master.',
  },
  'classic-fruit-slots': {
    title: 'Classic Fruit Slots | Games',
    description: 'Spin a classic 5-reel fruit slot machine with server-authoritative results.',
  },
  poker: {
    title: 'Poker Room | Games',
    description: "Play Texas Hold'em, Omaha, Omaha Hi-Lo, and 5 Card Draw on a live casino table.",
  },
  'puzzle-world': {
    title: 'Puzzle World | Games',
    description: 'A growing atlas of clever rooms, riddles, and satisfying snaps.',
  },
  'jigsaw-world': {
    title: 'Jigsaw World | Games',
    description: 'Play beautiful jigsaw puzzles online. Pick a picture, choose a cut, and snap every piece home.',
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
