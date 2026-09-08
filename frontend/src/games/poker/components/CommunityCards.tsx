'use client';

import type { PokerCard } from '../types';
import { PlayingCard } from './PlayingCard';

export function CommunityCards({ cards }: { cards: PokerCard[] }) {
  return (
    <div className="pk-community">
      {Array.from({ length: 5 }).map((_, index) => {
        const card = cards[index];
        return (
          <div key={card?.id || `slot-${index}`} className="pk-community-slot">
            {card ? <PlayingCard card={card} board delay={index * 110} /> : <span className="pk-community-empty" />}
          </div>
        );
      })}
    </div>
  );
}
