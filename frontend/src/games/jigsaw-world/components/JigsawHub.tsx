'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLeaderboard } from '@/hooks';
import { JIGSAW_PUZZLES } from '../catalog';
import { jigsawStorage } from '../storage';
import { CATEGORY_LABEL, DIFFICULTIES, type JigsawCategory, type JigsawDifficultyId } from '../types';

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
  const ranks = asRows(data?.data).slice(0, 5);
  const completed = jigsawStorage.getCompleted();
  const [filter, setFilter] = useState<JigsawCategory | 'all'>('all');
  const [selectedId, setSelectedId] = useState(JIGSAW_PUZZLES[0].id);
  const [difficulty, setDifficulty] = useState<JigsawDifficultyId>('easy');

  const puzzles = useMemo(
    () => JIGSAW_PUZZLES.filter((puzzle) => filter === 'all' || puzzle.category === filter),
    [filter]
  );
  const selected = puzzles.find((puzzle) => puzzle.id === selectedId) ?? puzzles[0] ?? JIGSAW_PUZZLES[0];

  return (
    <div className="jw-hub">
      <nav className="jw-nav">
        <Link href="/games" className="jw-nav-back">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Games
        </Link>
        <p className="jw-nav-brand">Jigsaw World</p>
        <span className="jw-nav-meta">Best {highScore.toLocaleString('en-US')}</span>
      </nav>

      <section className="jw-hero">
        <div className="jw-logo" aria-hidden="true">
          <span className="jw-logo-mark">🧩</span>
          <span className="jw-logo-word">
            <b>Jigsaw</b> World
          </span>
        </div>
        <p className="jw-hero-lead">Play beautiful jigsaw puzzles online!</p>
        <p className="jw-copy">Easy and fun — anyone can do it. Pick a picture, choose a cut, and snap the world together.</p>
        <button type="button" className="jw-cta" onClick={() => onPlay(selected.id, difficulty)} disabled={starting}>
          {starting ? 'Starting…' : 'Play now online!'}
        </button>
      </section>

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

      <div className="jw-gallery" role="list">
        {puzzles.map((puzzle) => {
          const done = DIFFICULTIES.some((item) => completed[`${puzzle.id}:${item.id}`]);
          const active = selected.id === puzzle.id;
          return (
            <button
              key={puzzle.id}
              type="button"
              role="listitem"
              className={`jw-card ${active ? 'is-on' : ''}`}
              onClick={() => setSelectedId(puzzle.id)}
            >
              <span className="jw-card-art" style={{ backgroundImage: `url(${puzzle.src})` }} />
              <span className="jw-card-meta">
                <strong>{puzzle.title}</strong>
                <em>{CATEGORY_LABEL[puzzle.category]}</em>
              </span>
              {done && <span className="jw-card-done">Done</span>}
            </button>
          );
        })}
      </div>

      <section className="jw-dock">
        <div className="jw-dock-preview" style={{ backgroundImage: `url(${selected.src})` }} />
        <div className="jw-dock-copy">
          <p className="jw-kicker">{CATEGORY_LABEL[selected.category]}</p>
          <h2>{selected.title}</h2>
          <p className="jw-copy">{selected.blurb}</p>
          <div className="jw-diff" role="group" aria-label="Difficulty">
            {DIFFICULTIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`jw-chip ${difficulty === item.id ? 'is-on' : ''}`}
                onClick={() => setDifficulty(item.id)}
              >
                {item.label}
                <small>{item.blurb}</small>
              </button>
            ))}
          </div>
          {error && (
            <p className="jw-copy" role="alert">
              {error}
            </p>
          )}
          <Button size="lg" onClick={() => onPlay(selected.id, difficulty)} isLoading={starting} disabled={starting}>
            Start {selected.title}
          </Button>
        </div>
        {ranks.length > 0 && (
          <ol className="jw-ranks" aria-label="Server leaderboard">
            {ranks.map((row, index) => (
              <li key={`${rowName(row)}-${index}`}>
                <b>#{row.rank || index + 1}</b>
                <span>{rowName(row)}</span>
                <em>{rowScore(row).toLocaleString('en-US')}</em>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
