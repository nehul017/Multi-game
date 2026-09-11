'use client';

import { getInitials } from '@/lib/utils';

interface CarromPlayerCardProps {
  name: string;
  avatar?: string;
  score: number;
  coins: number;
  side: 'left' | 'right';
  active: boolean;
  connected?: boolean;
}

export function CarromPlayerCard({
  name,
  avatar,
  score,
  coins,
  side,
  active,
  connected = true,
}: CarromPlayerCardProps) {
  return (
    <div className={`carrom-player is-${side} ${active ? 'is-active' : ''} ${connected ? '' : 'is-away'}`}>
      <div className="carrom-player-avatar" aria-hidden={!avatar}>
        {avatar ? (
          <img src={avatar} alt="" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
        <i className={`carrom-player-dot ${connected ? 'is-on' : ''}`} />
      </div>
      <div className="carrom-player-meta">
        <p className="carrom-player-name">{name}</p>
        <div className="carrom-player-stats">
          <span className="carrom-player-score">{score}</span>
          <span className="carrom-player-coins">{coins}</span>
        </div>
      </div>
    </div>
  );
}
