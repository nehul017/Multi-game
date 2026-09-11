'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import { CATEGORY_LABEL, DIFFICULTIES, type JigsawPuzzleDef } from '../types';

interface JigsawCardProps {
  puzzle: JigsawPuzzleDef;
  active: boolean;
  completed: boolean;
  onSelect: () => void;
  onPlay: () => void;
}

export function JigsawCard({ puzzle, active, completed, onSelect, onPlay }: JigsawCardProps) {
  return (
    <article className={`jw-card${active ? ' is-on' : ''}`}>
      <button type="button" className="jw-card-hit" onClick={onSelect} aria-pressed={active} aria-label={`Select ${puzzle.title}`}>
        <span className="jw-card-media">
          <Image src={puzzle.src} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 280px" className="jw-card-photo" />
        </span>
        <span className="jw-card-veil" />
        <span className="jw-card-meta">
          <strong>{puzzle.title}</strong>
          <em>{CATEGORY_LABEL[puzzle.category]}</em>
          <small>{DIFFICULTIES.map((item) => item.cols * item.rows).join(' / ')} Pieces</small>
        </span>
        {completed && <span className="jw-card-done">Cleared</span>}
      </button>
      <button
        type="button"
        className="jw-card-play"
        onClick={onPlay}
        aria-label={`Play ${puzzle.title}`}
      >
        <Play className="w-4 h-4" aria-hidden="true" />
      </button>
    </article>
  );
}
