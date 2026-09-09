'use client';

import { memo, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import {
  SUIT_GLYPH,
  SUIT_LABEL,
  isRedSuit,
  type MindiCard,
  type MindiCardState,
  type MindiRank,
} from './types';

export interface MindiCardViewProps {
  card?: MindiCard | null;
  state?: MindiCardState;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  style?: CSSProperties;
  label?: string;
  /** @deprecated prefer `state` */
  hidden?: boolean;
  /** @deprecated prefer `state` */
  legal?: boolean;
  /** @deprecated prefer `state` */
  dimmed?: boolean;
}

const HIGH_RANKS = new Set<MindiRank>(['10', 'J', 'Q', 'K', 'A']);

const PIP_SLOTS: Partial<Record<MindiRank, string[]>> = {
  '2': ['tc', 'bc'],
  '3': ['tc', 'mc', 'bc'],
  '4': ['tl', 'tr', 'bl', 'br'],
  '5': ['tl', 'tr', 'mc', 'bl', 'br'],
  '6': ['tl', 'tr', 'ml', 'mr', 'bl', 'br'],
  '7': ['tl', 'tr', 'ml', 'mr', 'bl', 'br', 'utc'],
  '8': ['tl', 'tr', 'uml', 'umr', 'lml', 'lmr', 'bl', 'br'],
  '9': ['tl', 'tr', 'uml', 'umr', 'mc', 'lml', 'lmr', 'bl', 'br'],
  '10': ['tl', 'tr', 'utc', 'uml', 'umr', 'lml', 'lmr', 'dbc', 'bl', 'br'],
};

function resolveState(props: MindiCardViewProps): MindiCardState {
  if (props.state) return props.state;
  if (props.hidden || !props.card) return 'hidden';
  if (props.selected) return 'selected';
  if (props.dimmed || props.disabled) return 'disabled';
  if (props.legal) return 'playable';
  return 'normal';
}

function SuitMark({ suit, className }: { suit: MindiCard['suit']; className?: string }) {
  return (
    <span className={cn('mindi-suit', className)} aria-hidden>
      {SUIT_GLYPH[suit]}
    </span>
  );
}

function CardFace({ card, size }: { card: MindiCard; size: 'sm' | 'md' | 'lg' }) {
  const red = isRedSuit(card.suit);
  const high = HIGH_RANKS.has(card.rank);
  const pips = size === 'sm' ? undefined : PIP_SLOTS[card.rank];
  const faceRank = card.rank === 'J' || card.rank === 'Q' || card.rank === 'K' || card.rank === 'A';

  return (
    <span
      className={cn(
        'mindi-card-face',
        red ? 'is-red' : 'is-black',
        high && 'is-high',
        card.rank === '10' && 'is-ten'
      )}
    >
      <span className="mindi-card-paper" aria-hidden />
      <span className="mindi-card-corner is-tl">
        <b>{card.rank}</b>
        <SuitMark suit={card.suit} />
      </span>
      <span className="mindi-card-corner is-br">
        <b>{card.rank}</b>
        <SuitMark suit={card.suit} />
      </span>

      {pips && (
        <span className="mindi-pips" aria-hidden>
          {pips.map((slot) => (
            <SuitMark key={slot} suit={card.suit} className={`is-pip is-${slot}`} />
          ))}
        </span>
      )}

      {(faceRank || size === 'sm' || !pips) && (
        <span className={cn('mindi-card-center', faceRank && 'is-face-rank')} aria-hidden>
          {faceRank && <b>{card.rank}</b>}
          <SuitMark suit={card.suit} className="is-center" />
        </span>
      )}
    </span>
  );
}

function MindiCardViewInner(props: MindiCardViewProps) {
  const { card, selected, size = 'md', disabled, onClick, onHover, style, label } = props;
  const visual = resolveState(props);
  const face = visual !== 'hidden' && card;
  const clickable = Boolean(onClick) && !disabled && visual !== 'hidden' && visual !== 'disabled';

  const body = (
    <span className="mindi-card-inner">
      {face ? (
        <CardFace card={card} size={size} />
      ) : (
        <span className="mindi-card-back" aria-hidden>
          <span className="mindi-card-back-pattern" />
          <span className="mindi-card-back-frame" />
          <span className="mindi-card-back-mark">♠</span>
        </span>
      )}
    </span>
  );

  const className = cn(
    'mindi-card',
    `is-${size}`,
    `is-${visual}`,
    face && 'is-face',
    !face && 'is-back',
    face && HIGH_RANKS.has(card.rank) && 'is-high-card',
    face && card.rank === '10' && 'is-ten-card',
    (selected || visual === 'selected') && 'is-selected',
    clickable && 'is-clickable'
  );
  const ariaLabel = label || (face ? `${card.rank} of ${SUIT_LABEL[card.suit]}` : 'Facedown card');

  if (clickable) {
    return (
      <button
        type="button"
        className={className}
        style={style}
        onClick={onClick}
        onMouseEnter={onHover}
        aria-pressed={selected || visual === 'selected'}
        aria-label={ariaLabel}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={className} style={style} aria-label={ariaLabel} role="img">
      {body}
    </div>
  );
}

export const MindiCardView = memo(MindiCardViewInner);

export const Card = MindiCardView;

export const CardBack = memo(function CardBack(props: Omit<MindiCardViewProps, 'hidden' | 'state'>) {
  return <MindiCardView {...props} state="hidden" hidden />;
});
