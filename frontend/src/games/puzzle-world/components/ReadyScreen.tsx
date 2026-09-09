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
  const { data } = useLeaderboard('all', 'puzzle-world', 1);
  const ranks = asRows(data?.data).slice(0, 5);

  return (
    <div className="pw-overlay" role="dialog" aria-labelledby="pw-ready-title" aria-modal="true">
      <motion.section
        className="pw-dialog"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
      >
        <p className="pw-kicker">Puzzle</p>
        <h2 id="pw-ready-title">Puzzle World</h2>
        <p className="pw-copy">
          Open rooms across a growing atlas. Tap tiles to rotate the path. When the door meets the exit — and every
          crystal sits on the line — the room snaps shut.
        </p>
        <p className="pw-best">Best: {highScore.toLocaleString('en-US')}</p>
        {ranks.length > 0 && (
          <ol className="pw-ranks" aria-label="Server leaderboard">
            {ranks.map((row, index) => (
              <li key={`${rowName(row)}-${index}`}>
                <b>#{row.rank || index + 1}</b>
                <span>{rowName(row)}</span>
                <em>{rowScore(row).toLocaleString('en-US')}</em>
              </li>
            ))}
          </ol>
        )}
        <ul className="pw-keys" aria-label="How to play">
          <li>Tap a tile to rotate</li>
          <li>Light the path from IN to OUT</li>
          <li>Collect crystals on the path</li>
          <li>Arrows select · Space rotate · U undo</li>
        </ul>
        <div className="pw-dialog-actions">
          {error && (
            <p className="pw-copy" role="alert">
              {error}
            </p>
          )}
          <Button size="lg" onClick={onStart} className="w-full" isLoading={starting} disabled={starting}>
            Enter the atlas
          </Button>
          <Button size="lg" variant="ghost" className="w-full" onClick={() => router.push('/games')}>
            Back to Games
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
