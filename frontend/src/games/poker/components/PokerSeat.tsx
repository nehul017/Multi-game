'use client';

import type { CSSProperties } from 'react';
import type { PublicSeatPlayer } from '../types';
import { BlindIndicator, DealerButton } from './DealerButton';
import { PlayerAvatar } from './PlayerAvatar';
import { PlayerCards } from './PlayerCards';

interface PokerSeatProps {
  player?: PublicSeatPlayer;
  isHero?: boolean;
  isTurn?: boolean;
  winner?: boolean;
  style?: CSSProperties;
  selectedDiscards?: number[];
  onToggleDiscard?: (index: number) => void;
  drawSelect?: boolean;
}

export function PokerSeat({
  player,
  isHero,
  isTurn,
  winner,
  style,
  selectedDiscards,
  onToggleDiscard,
  drawSelect,
}: PokerSeatProps) {
  if (!player) {
    return (
      <div className="pk-seat is-empty" style={style}>
        <span className="pk-empty-chair" aria-hidden />
        <span>Open seat</span>
      </div>
    );
  }

  return (
    <div
      className={`pk-seat is-${player.status} ${isHero ? 'is-hero' : ''} ${isTurn ? 'is-turn' : ''} ${winner ? 'is-winner' : ''}`}
      style={style}
    >
      <PlayerCards
        cards={player.holeCards || []}
        count={player.holeCardCount}
        winner={winner}
        folded={player.status === 'folded'}
        hero={isHero}
        selectable={Boolean(isHero && drawSelect)}
        selected={selectedDiscards}
        onToggle={onToggleDiscard}
      />
      <div className="pk-seat-plaque">
        <PlayerAvatar name={player.username} src={player.avatar} bot={player.isBot} />
        <div className="pk-seat-copy">
          <p className="pk-seat-name">
            {isHero ? 'You' : player.username}
            {player.isBot ? <em>bot</em> : null}
          </p>
          <p className="pk-seat-stack">{player.chips.toLocaleString()}</p>
        </div>
        <div className="pk-seat-flags">
          {player.isDealer && <DealerButton />}
          {player.isSmallBlind && <BlindIndicator kind="SB" />}
          {player.isBigBlind && <BlindIndicator kind="BB" />}
        </div>
      </div>
      <span className="pk-seat-status">{player.status.replace('-', ' ')}</span>
    </div>
  );
}
