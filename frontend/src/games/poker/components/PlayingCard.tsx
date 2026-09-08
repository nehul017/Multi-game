'use client';

import type { PokerCard } from '../types';

const SUIT_PATH: Record<PokerCard['suit'], string> = {
  spades:
    'M12 2C9 7 5.5 10.2 5.5 13.4c0 2.6 1.9 4.2 4.1 4.4-.3 1.1-.9 2.1-1.9 2.8h8.6c-1-.7-1.6-1.7-1.9-2.8 2.2-.2 4.1-1.8 4.1-4.4C18.5 10.2 15 7 12 2z',
  hearts:
    'M12 21S3.2 14.4 3.2 8.8C3.2 5.9 5.4 4 8 4c1.7 0 3.2.9 4 2.2C12.8 4.9 14.3 4 16 4c2.6 0 4.8 1.9 4.8 4.8C20.8 14.4 12 21 12 21z',
  diamonds: 'M12 2l7 10-7 10-7-10 7-10z',
  clubs:
    'M12 3.2c-1.9 0-3.5 1.6-3.5 3.6 0 .6.1 1.1.4 1.6-1.7-.3-3.3.9-3.3 2.7 0 1.8 1.5 3.1 3.3 3.1.5 0 1-.1 1.4-.3-.2 1.1-.8 2.1-1.8 2.8h6.9c-1-.7-1.6-1.7-1.8-2.8.4.2.9.3 1.4.3 1.8 0 3.3-1.3 3.3-3.1 0-1.8-1.6-3-3.3-2.7.3-.5.4-1 .4-1.6 0-2-1.6-3.6-3.5-3.6z',
};

const RANK_LABEL: Record<string, string> = {
  '10': '10',
  J: 'J',
  Q: 'Q',
  K: 'K',
  A: 'A',
};

interface PlayingCardProps {
  card?: PokerCard | null;
  hidden?: boolean;
  small?: boolean;
  board?: boolean;
  selected?: boolean;
  winner?: boolean;
  mucked?: boolean;
  delay?: number;
  onClick?: () => void;
}

export function PlayingCard({
  card,
  hidden,
  small,
  board,
  selected,
  winner,
  mucked,
  delay = 0,
  onClick,
}: PlayingCardProps) {
  const face = !hidden && !mucked && card;
  const red = card?.suit === 'hearts' || card?.suit === 'diamonds';

  return (
    <button
      type="button"
      className={`pk-card ${small ? 'is-small' : ''} ${board ? 'is-board' : ''} ${selected ? 'is-selected' : ''} ${winner ? 'is-winner' : ''} ${mucked ? 'is-mucked' : ''} ${face ? 'is-face' : 'is-back'}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
      disabled={!onClick}
      aria-label={face ? `${card.rank} of ${card.suit}` : 'Facedown card'}
    >
      <span className="pk-card-inner">
        {face ? (
          <span className={`pk-card-face ${red ? 'is-red' : 'is-black'}`}>
            <span className="pk-card-corner is-tl">
              <b>{RANK_LABEL[card.rank] || card.rank}</b>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d={SUIT_PATH[card.suit]} />
              </svg>
            </span>
            <svg className="pk-card-suit" viewBox="0 0 24 24" aria-hidden>
              <path d={SUIT_PATH[card.suit]} />
            </svg>
            <span className="pk-card-corner is-br">
              <b>{RANK_LABEL[card.rank] || card.rank}</b>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d={SUIT_PATH[card.suit]} />
              </svg>
            </span>
          </span>
        ) : (
          <span className="pk-card-back">
            <span className="pk-card-back-pattern" />
            <span className="pk-card-back-mark">♠</span>
          </span>
        )}
      </span>
    </button>
  );
}

export function CardBack(props: Omit<PlayingCardProps, 'hidden'>) {
  return <PlayingCard {...props} hidden />;
}
