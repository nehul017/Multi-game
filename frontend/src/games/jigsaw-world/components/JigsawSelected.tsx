'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import { CATEGORY_LABEL, DIFFICULTIES, type JigsawDifficultyId, type JigsawPuzzleDef } from '../types';

interface JigsawSelectedProps {
  puzzle: JigsawPuzzleDef;
  difficulty: JigsawDifficultyId;
  starting?: boolean;
  error?: string | null;
  ranks: Array<{ name: string; score: number; rank: number }>;
  onDifficulty: (id: JigsawDifficultyId) => void;
  onPlay: () => void;
}

export function JigsawSelected({
  puzzle,
  difficulty,
  starting,
  error,
  ranks,
  onDifficulty,
  onPlay,
}: JigsawSelectedProps) {
  return (
    <section id="jw-selected" className="jw-selected" aria-labelledby="jw-selected-title">
      <div className="jw-selected-art">
        <Image src={puzzle.src} alt={puzzle.title} fill sizes="(max-width: 860px) 100vw, 48vw" className="jw-selected-photo" />
        <div className="jw-selected-veil" />
      </div>
      <div className="jw-selected-copy">
        <p className="jw-kicker">{CATEGORY_LABEL[puzzle.category]}</p>
        <h2 id="jw-selected-title">{puzzle.title}</h2>
        <p className="jw-copy">{puzzle.blurb}</p>
        <div className="jw-diff" role="group" aria-label="Difficulty">
          {DIFFICULTIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`jw-diff-btn${difficulty === item.id ? ' is-on' : ''}`}
              onClick={() => onDifficulty(item.id)}
            >
              <b>{item.label}</b>
              <small>{item.blurb}</small>
            </button>
          ))}
        </div>
        {error && (
          <p className="jw-copy" role="alert">
            {error}
          </p>
        )}
        <div className="jw-selected-actions">
          <button type="button" className="jw-cta" onClick={onPlay} disabled={starting}>
            <Play className="w-4 h-4" aria-hidden="true" />
            {starting ? 'Starting…' : 'Play Puzzle'}
          </button>
          <p className="jw-selected-note">Solo session · pieces snap when close</p>
        </div>
        {ranks.length > 0 && (
          <ol className="jw-ranks" aria-label="Server leaderboard">
            {ranks.map((row) => (
              <li key={`${row.name}-${row.rank}`}>
                <b>#{row.rank}</b>
                <span>{row.name}</span>
                <em>{row.score.toLocaleString('en-US')}</em>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
