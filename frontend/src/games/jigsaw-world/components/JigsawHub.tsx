'use client';

import { useMemo, useState } from 'react';
import { useLeaderboard } from '@/hooks';
import { JIGSAW_PUZZLES } from '../catalog';
import { jigsawStorage } from '../storage';
import { CATEGORY_LABEL, DIFFICULTIES, type JigsawCategory, type JigsawDifficultyId } from '../types';
import { JigsawCard } from './JigsawCard';
import { JigsawHero } from './JigsawHero';
import { JigsawLobbyHeader } from './JigsawLobbyHeader';
import { JigsawSelected } from './JigsawSelected';

interface JigsawHubProps {
  highScore: number;
  starting?: boolean;
  error?: string | null;
  onPlay: (puzzleId: string, difficulty: JigsawDifficultyId) => void;
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

const FILTERS: Array<JigsawCategory | 'all'> = ['all', 'nature', 'landscapes', 'art', 'travel', 'portraits'];

export function JigsawHub({ highScore, starting, error, onPlay }: JigsawHubProps) {
  const { data } = useLeaderboard('all', 'jigsaw-world', 1);
  const ranks = asRows(data?.data)
    .slice(0, 5)
    .map((row, index) => ({
      name: rowName(row),
      score: rowScore(row),
      rank: row.rank || index + 1,
    }));
  const completed = jigsawStorage.getCompleted();
  const [filter, setFilter] = useState<JigsawCategory | 'all'>('all');
  const [selectedId, setSelectedId] = useState(JIGSAW_PUZZLES[0].id);
  const [difficulty, setDifficulty] = useState<JigsawDifficultyId>('easy');

  const puzzles = useMemo(
    () => JIGSAW_PUZZLES.filter((puzzle) => filter === 'all' || puzzle.category === filter),
    [filter]
  );
  const selected = puzzles.find((puzzle) => puzzle.id === selectedId) ?? puzzles[0] ?? JIGSAW_PUZZLES[0];

  const scrollToSelected = () => {
    document.getElementById('jw-selected')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="jw-hub">
      <JigsawLobbyHeader />

      <div className="jw-hub-body">
        <JigsawHero
          puzzle={selected}
          starting={starting}
          onPlay={() => onPlay(selected.id, difficulty)}
          onDetails={scrollToSelected}
        />

        <div className="jw-section-head">
          <div>
            <h2>Explore Worlds</h2>
            <p>Beautiful worlds. One piece at a time.</p>
          </div>
          <span className="jw-best">Best {highScore.toLocaleString('en-US')}</span>
        </div>

        <div className="jw-filters" role="tablist" aria-label="Puzzle categories">
          {FILTERS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              className={`jw-chip ${filter === id ? 'is-on' : ''}`}
              onClick={() => {
                setFilter(id);
                const next = JIGSAW_PUZZLES.find((puzzle) => id === 'all' || puzzle.category === id);
                if (next) setSelectedId(next.id);
              }}
            >
              {id === 'all' ? 'All' : CATEGORY_LABEL[id]}
            </button>
          ))}
        </div>

        <div className="jw-section-head jw-section-tight">
          <h3>Popular Puzzles</h3>
        </div>

        <div className="jw-gallery" role="list">
          {puzzles.map((puzzle) => {
            const done = DIFFICULTIES.some((item) => completed[`${puzzle.id}:${item.id}`]);
            return (
              <div key={puzzle.id} role="listitem">
                <JigsawCard
                  puzzle={puzzle}
                  active={selected.id === puzzle.id}
                  completed={done}
                  onSelect={() => setSelectedId(puzzle.id)}
                  onPlay={() => {
                    setSelectedId(puzzle.id);
                    onPlay(puzzle.id, difficulty);
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="jw-section-head">
          <h3>Selected Puzzle</h3>
        </div>

        <JigsawSelected
          puzzle={selected}
          difficulty={difficulty}
          starting={starting}
          error={error}
          ranks={ranks}
          onDifficulty={setDifficulty}
          onPlay={() => onPlay(selected.id, difficulty)}
        />
      </div>
    </div>
  );
}
