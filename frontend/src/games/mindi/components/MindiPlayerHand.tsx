'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MindiCardView } from '../MindiCardView';
import type { MindiCard, MindiCardState } from '../types';

interface MindiPlayerHandProps {
  cards: MindiCard[];
  legalIds: Set<string>;
  selectedId: string | null;
  isMyTurn?: boolean;
  disabled?: boolean;
  dealing?: boolean;
  onSelect: (cardId: string) => void;
  onHover?: () => void;
}

export function MindiPlayerHand({
  cards,
  legalIds,
  selectedId,
  isMyTurn,
  disabled,
  dealing,
  onSelect,
  onHover,
}: MindiPlayerHandProps) {
  const reduce = useReducedMotion();
  const mid = (cards.length - 1) / 2;

  const items = useMemo(
    () =>
      cards.map((card, index) => {
        const allowed = legalIds.has(card.id) && !!isMyTurn && !disabled;
        const selected = selectedId === card.id;
        const state: MindiCardState = !isMyTurn || disabled || !allowed ? 'disabled' : selected ? 'selected' : 'playable';
        const angle = (index - mid) * 5.2;
        return { card, allowed, selected, state, angle, index };
      }),
    [cards, legalIds, selectedId, isMyTurn, disabled, mid]
  );

  return (
    <div className="mindi-hand-wrap">
      {isMyTurn && !disabled && <p className="mindi-hand-turn">Your turn — play a highlighted card</p>}
    <div className="mindi-hand" role="list" aria-label="Your hand">
      {items.map(({ card, allowed, selected, state, angle, index }) => (
        <motion.div
          key={card.id}
          id={`mindi-hand-${card.id}`}
          role="listitem"
          className="mindi-hand-slot"
          layoutId={`mindi-card-${card.id}`}
          style={{ zIndex: selected ? 40 : index }}
          initial={dealing && !reduce ? { y: -110, opacity: 0, rotate: 0, scale: 0.72 } : false}
          animate={{
            y: selected ? -18 : 0,
            opacity: 1,
            rotate: reduce ? 0 : angle,
            scale: 1,
          }}
          transition={{
            delay: dealing && !reduce ? index * 0.045 : 0,
            type: 'spring',
            stiffness: 320,
            damping: 24,
          }}
        >
          <MindiCardView
            card={card}
            size="lg"
            state={state}
            selected={selected}
            onHover={allowed ? onHover : undefined}
            onClick={allowed ? () => onSelect(card.id) : undefined}
          />
        </motion.div>
      ))}
    </div>
    </div>
  );
}
