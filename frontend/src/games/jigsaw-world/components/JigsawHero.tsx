'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import type { JigsawPuzzleDef } from '../types';

interface JigsawHeroProps {
  puzzle: JigsawPuzzleDef;
  starting?: boolean;
  onPlay: () => void;
  onDetails: () => void;
}

export function JigsawHero({ puzzle, starting, onPlay, onDetails }: JigsawHeroProps) {
  return (
    <section className="jw-hero-stage">
      <div className="jw-hero-copy">
        <p className="jw-kicker">Premium puzzle lobby</p>
        <h1>Jigsaw World</h1>
        <p className="jw-hero-lead">Relax. Challenge yourself. Complete beautiful worlds.</p>
        <p className="jw-copy">Pick a cinematic scene, choose your cut, and snap every piece home.</p>
        <div className="jw-hero-actions">
          <button type="button" className="jw-cta" onClick={onPlay} disabled={starting}>
            <Play className="w-4 h-4" aria-hidden="true" />
            {starting ? 'Starting…' : 'Play Now'}
          </button>
          <button type="button" className="jw-cta-ghost" onClick={onDetails}>
            View details
          </button>
        </div>
      </div>
      <div className="jw-hero-art">
        <Image
          src={puzzle.src}
          alt={puzzle.title}
          fill
          priority
          sizes="(max-width: 860px) 100vw, 52vw"
          className="jw-hero-photo"
        />
        <div className="jw-hero-veil" />
        <div className="jw-hero-caption">
          <span>{puzzle.title}</span>
          <em>Featured world</em>
        </div>
      </div>
    </section>
  );
}
