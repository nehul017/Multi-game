'use client';

interface JigsawHUDProps {
  title: string;
  placed: number;
  total: number;
  elapsedMs: number;
  difficulty: string;
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function JigsawHUD({ title, placed, total, elapsedMs, difficulty }: JigsawHUDProps) {
  const progress = total ? Math.round((placed / total) * 100) : 0;

  return (
    <div className="jw-hud">
      <div>
        <span>Puzzle</span>
        <b>{title}</b>
      </div>
      <div>
        <span>Pieces</span>
        <b>
          {placed}/{total}
        </b>
      </div>
      <div>
        <span>Time</span>
        <b>{formatTime(elapsedMs)}</b>
      </div>
      <div>
        <span>{difficulty}</span>
        <b>{progress}%</b>
      </div>
    </div>
  );
}
