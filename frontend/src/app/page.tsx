import type { Metadata } from 'next';
import { HomePage } from '@/components/home/HomePage';

export const metadata: Metadata = {
  title: 'GAMEHUB — Play. Compete. Connect.',
  description:
    'Enter the arena, challenge players around the world, and climb the leaderboard in GAMEHUB.',
};

export default function Page() {
  return <HomePage />;
}
