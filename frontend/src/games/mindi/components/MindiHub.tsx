'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Bot, Lock, Swords, Users } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { MindiCardView } from '../MindiCardView';
import type { BotDifficulty, MindiCard } from '../types';

const SAMPLE: MindiCard[] = [
  { id: 'lobby-ah', suit: 'hearts', rank: 'A', value: 14 },
  { id: 'lobby-ts', suit: 'spades', rank: '10', value: 10 },
  { id: 'lobby-kd', suit: 'diamonds', rank: 'K', value: 13 },
  { id: 'lobby-tc', suit: 'clubs', rank: '10', value: 10 },
  { id: 'lobby-qs', suit: 'spades', rank: 'Q', value: 12 },
];

const MODES: Array<{
  mode: 'bots' | 'match' | 'private';
  title: string;
  text: string;
  icon: ReactNode;
  featured?: boolean;
}> = [
  {
    mode: 'bots',
    title: 'Practice',
    text: 'Sit immediately with three bots.',
    icon: <Bot className="w-5 h-5" />,
    featured: true,
  },
  {
    mode: 'bots',
    title: 'Quick Table',
    text: 'Same table, empty seats fill with bots.',
    icon: <Swords className="w-5 h-5" />,
  },
  {
    mode: 'match',
    title: 'Find Match',
    text: 'Wait for players. Bots sit after 1 minute.',
    icon: <Users className="w-5 h-5" />,
  },
  {
    mode: 'private',
    title: 'Private Room',
    text: 'Invite friends. Bots sit after 1 minute.',
    icon: <Lock className="w-5 h-5" />,
  },
];

export function MindiHub() {
  return (
    <AuthGuard>
      <MindiHubInner />
    </AuthGuard>
  );
}

function MindiHubInner() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');

  const goPlay = (mode: 'bots' | 'match' | 'private') => {
    const params = new URLSearchParams({ mode, difficulty });
    router.push(`/games/mindi/play?${params.toString()}`);
  };

  return (
    <div className="mindi-root mindi-lobby">
      <div className="mindi-ambience" aria-hidden />
      <nav className="mindi-nav">
        <Link href="/games" className="mindi-nav-back">
          <ArrowLeft className="w-4 h-4" />
          Games
        </Link>
        <p className="mindi-nav-brand">
          <span aria-hidden>♠</span>
          Mindi Cot
        </p>
        <span className="mindi-nav-meta">
          <em>Partnership table</em>
        </span>
      </nav>

      <div className="mindi-lobby-stage">
        <motion.div
          className="mindi-lobby-hero"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mindi-lobby-copy">
            <p className="mindi-kicker">Capture the 10s</p>
            <h1>Mindi Cot</h1>
            <p className="mindi-lobby-lead">
              Four seats. Two teams. Follow suit, watch the trump, and take the tens.
            </p>
            <ul className="mindi-lobby-rules">
              <li>Team A sits opposite Team B</li>
              <li>3+ tens wins the deal</li>
              <li>Trump is the dealer’s last card</li>
            </ul>
            <div className="mindi-diff">
              <span>Bot strength</span>
              <div className="mindi-diff-pills" role="group" aria-label="Bot difficulty">
                {(['easy', 'medium', 'hard'] as BotDifficulty[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={difficulty === level ? 'is-on' : ''}
                    onClick={() => setDifficulty(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mindi-lobby-table" aria-hidden>
            <div className="mindi-lobby-rail" />
            <div className="mindi-lobby-felt">
              <p>♠ ♦ ♥ ♣</p>
              <strong>Mindi Cot</strong>
            </div>
            <div className="mindi-lobby-fan">
              {SAMPLE.map((card, index) => (
                <span
                  key={card.id}
                  className="mindi-lobby-fan-slot"
                  style={{
                    transform: `translateX(${(index - 2) * 28}px) rotate(${(index - 2) * 8}deg)`,
                    zIndex: index,
                  }}
                >
                  <MindiCardView card={card} size="md" />
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="mindi-lobby-modes">
          {MODES.map((item) => (
            <button
              key={item.title}
              type="button"
              className={`mindi-mode ${item.featured ? 'is-featured' : ''}`}
              onClick={() => goPlay(item.mode)}
            >
              <span className="mindi-mode-icon">{item.icon}</span>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
