'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useLeaderboard } from '@/hooks';

interface ReadyScreenProps {
  highScore: number;
  onStart: () => void;
  error?: string | null;
  starting?: boolean;
}

interface LeaderboardRow {
  rank?: number;
  username?: string;
  elo?: number;
  score?: number;
  user?: { username?: string };
}

function asRows(data: unknown): LeaderboardRow[] {
  const payload = data as { data?: LeaderboardRow[] } | LeaderboardRow[] | undefined;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function rowName(row: LeaderboardRow): string {
  return row.username || row.user?.username || 'Player';
}

function rowScore(row: LeaderboardRow): number {
  return Number(row.score ?? row.elo ?? 0);
}

export function ReadyScreen({ highScore, onStart, error, starting }: ReadyScreenProps) {
  const router = useRouter();
  const { data } = useLeaderboard('all', 'block-master', 1);
  const ranks = asRows(data?.data).slice(0, 5);

  return (
    <div className="bm-overlay" role="dialog" aria-labelledby="bm-ready-title" aria-modal="true">
      <motion.section
        className="bm-dialog"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
      >
        <p className="bm-kicker">Puzzle</p>
        <h2 id="bm-ready-title">Block Master</h2>
        <p className="bm-copy">Stack, rotate, and clear under rising pressure.</p>
        <p className="bm-best">Best: {highScore.toLocaleString('en-US')}</p>
        {ranks.length > 0 && (
          <ol className="bm-ranks" aria-label="Server leaderboard">
            {ranks.map((row, index) => (
              <li key={`${rowName(row)}-${index}`}>
                <b>#{row.rank || index + 1}</b>
                <span>{rowName(row)}</span>
                <em>{rowScore(row).toLocaleString('en-US')}</em>
              </li>
            ))}
          </ol>
        )}
        <ul className="bm-keys" aria-label="Keyboard controls">
          <li>← → move</li>
          <li>↑ rotate</li>
          <li>↓ soft drop</li>
          <li>Space hard drop</li>
          <li>C hold · P pause</li>
        </ul>
        <div className="bm-dialog-actions">
          {error && <p className="bm-copy" role="alert">{error}</p>}
          <Button size="lg" onClick={onStart} className="w-full" isLoading={starting} disabled={starting}>
            Start Game
          </Button>
          <Button size="lg" variant="ghost" className="w-full" onClick={() => router.push('/games')}>
            Back to Games
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
