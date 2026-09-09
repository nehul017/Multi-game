'use client';

import { memo } from 'react';
import { Bot, Crown, WifiOff } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { CardBack } from '../MindiCardView';
import type { MindiSeat as MindiSeatData, MindiSeatSlot } from '../types';

export interface SeatPlayerMeta {
  userId: string;
  username: string;
  avatar?: string;
  connected?: boolean;
}

interface MindiSeatProps {
  seat: MindiSeatData;
  slot: MindiSeatSlot;
  meta?: SeatPlayerMeta;
  active?: boolean;
  thinking?: boolean;
  empty?: boolean;
}

function MindiSeatInner({ seat, slot, meta, active, thinking, empty }: MindiSeatProps) {
  const name = empty
    ? 'Waiting…'
    : seat.isBot
      ? meta?.username || 'Bot'
      : meta?.username || `Seat ${seat.seat + 1}`;
  const hiddenCount = slot === 'bottom' ? 0 : Math.min(seat.cardCount, 7);

  return (
    <article
      className={`mindi-seat is-${slot} ${active ? 'is-turn' : ''} ${thinking ? 'is-thinking' : ''} ${seat.team === 'A' ? 'is-team-a' : 'is-team-b'} ${empty ? 'is-empty' : ''}`}
      aria-label={`${name}, Team ${seat.team}${active ? ', current turn' : ''}`}
    >
      <div className="mindi-plaque">
        <span className="mindi-plaque-ring" aria-hidden />
        <Avatar
          name={name}
          src={empty ? undefined : meta?.avatar}
          size={slot === 'top' || slot === 'bottom' ? 'md' : 'sm'}
          online={active}
        />
        <div className="mindi-plaque-copy">
          <p className="mindi-plaque-name">
            {seat.isBot && !empty && <Bot className="w-3 h-3" aria-hidden />}
            {seat.isDealer && !empty && <Crown className="w-3 h-3 mindi-gold" aria-hidden />}
            <span className="truncate">{name}</span>
          </p>
          <p className="mindi-plaque-meta">
            {empty ? 'Open seat' : seat.isBot ? 'Bot' : 'Player'}
            <span className={`mindi-team-pill is-${seat.team.toLowerCase()}`}>Team {seat.team}</span>
            {meta?.connected === false && (
              <span className="mindi-away">
                <WifiOff className="w-3 h-3" />
                Away
              </span>
            )}
          </p>
        </div>
      </div>

      {slot !== 'bottom' && hiddenCount > 0 && (
        <div className={`mindi-back-row is-${slot}`} aria-label={`${seat.cardCount} hidden cards`}>
          {Array.from({ length: hiddenCount }).map((_, index) => (
            <CardBack key={`${seat.seat}-back-${index}`} size="sm" />
          ))}
          {seat.cardCount > hiddenCount && <span className="mindi-count">+{seat.cardCount - hiddenCount}</span>}
        </div>
      )}

      {active && !thinking && (
        <span className="mindi-turn-chip">{seat.isBot ? 'Bot turn' : slot === 'bottom' ? 'Your turn' : 'Turn'}</span>
      )}
      {thinking && (
        <span className="mindi-thinking" aria-live="polite">
          <i />
          Bot thinking
        </span>
      )}
    </article>
  );
}

export const MindiSeat = memo(MindiSeatInner);
