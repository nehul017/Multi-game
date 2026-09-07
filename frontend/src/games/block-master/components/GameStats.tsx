'use client';

import { cn } from '@/lib/utils';

interface GameStatsProps {
  score: number;
  level: number;
  lines: number;
  highScore: number;
  levelTick: number;
}

function formatScore(value: number) {
  return value.toLocaleString('en-US');
}

export function GameStats({ score, level, lines, highScore, levelTick }: GameStatsProps) {
  return (
    <div className="bm-stats" aria-label="Game statistics">
      <div className="bm-stat">
        <span>Score</span>
        <strong>{formatScore(score)}</strong>
      </div>
      <div key={levelTick} className={cn('bm-stat', levelTick > 0 && 'bm-stat-level')}>
        <span>Level</span>
        <strong>{level}</strong>
      </div>
      <div className="bm-stat">
        <span>Lines</span>
        <strong>{lines}</strong>
      </div>
      <div className="bm-stat bm-stat-best">
        <span>Best</span>
        <strong>{formatScore(highScore)}</strong>
      </div>
    </div>
  );
}
