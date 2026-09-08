'use client';

import type { PokerCard } from '../types';
import { PlayingCard } from './PlayingCard';

interface PlayerCardsProps {
  cards: Array<PokerCard | null>;
  count: number;
  winner?: boolean;
  folded?: boolean;
  hero?: boolean;
  selectable?: boolean;
  selected?: number[];
  onToggle?: (index: number) => void;
}

export function PlayerCards({
  cards,
  count,
  winner,
  folded,
  hero,
  selectable,
  selected = [],
  onToggle,
}: PlayerCardsProps) {
  const slots = cards.length > 0 ? cards : Array.from({ length: count }, () => null);

  return (
    <div className={`pk-player-cards ${winner ? 'is-winner' : ''} ${folded ? 'is-folded' : ''} ${hero ? 'is-hero-cards' : ''}`}>
      {slots.map((card, index) => (
        <PlayingCard
          key={card?.id || `hidden-${index}`}
          card={card}
          hidden={!card}
          mucked={folded && !hero}
          small={!hero && slots.length > 2}
          selected={selected.includes(index)}
          winner={winner}
          delay={index * 70}
          onClick={selectable && onToggle ? () => onToggle(index) : undefined}
        />
      ))}
    </div>
  );
}
