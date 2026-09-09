'use client';

interface PuzzleHUDProps {
  score: number;
  roomsSolved: number;
  roomCount: number;
  moves: number;
  elapsedMs: number;
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PuzzleHUD({ score, roomsSolved, roomCount, moves, elapsedMs }: PuzzleHUDProps) {
  return (
    <dl className="pw-hud">
      <div>
        <dt>Score</dt>
        <dd>{score.toLocaleString('en-US')}</dd>
      </div>
      <div>
        <dt>Rooms</dt>
        <dd>
          {roomsSolved}/{roomCount}
        </dd>
      </div>
      <div>
        <dt>Turns</dt>
        <dd>{moves}</dd>
      </div>
      <div>
        <dt>Time</dt>
        <dd>{formatTime(elapsedMs)}</dd>
      </div>
    </dl>
  );
}
