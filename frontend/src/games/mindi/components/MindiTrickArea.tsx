'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MindiCardView } from '../MindiCardView';
import type { MindiCompletedTrick, MindiPlayedCard, MindiSeatSlot } from '../types';

interface MindiTrickAreaProps {
  trick: MindiPlayedCard[];
  layout: Record<number, MindiSeatSlot>;
  isMyTurn?: boolean;
  collecting?: MindiCompletedTrick | null;
  tenFlash?: boolean;
  dealing?: boolean;
}

const SLOT_MOTION: Record<MindiSeatSlot, { x: number; y: number; rotate: number }> = {
  top: { x: 0, y: -46, rotate: -8 },
  bottom: { x: 0, y: 46, rotate: 5 },
  left: { x: -52, y: 4, rotate: -14 },
  right: { x: 52, y: 4, rotate: 14 },
};

export function MindiTrickArea({
  trick,
  layout,
  isMyTurn,
  collecting,
  tenFlash,
  dealing,
}: MindiTrickAreaProps) {
  const reduce = useReducedMotion();
  const cards = collecting?.cards || trick;
  const winningId = collecting?.winningCard.id;

  return (
    <div className="mindi-felt" aria-live="polite">
      <div className="mindi-felt-brand" aria-hidden>
        <span>♠ ♦ ♥ ♣</span>
        <strong>Mindi Cot</strong>
      </div>
      {dealing && (
        <div className="mindi-center-deck" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      )}
      <AnimatePresence>
        {cards.map((played) => {
          const slot = layout[played.seat] || 'bottom';
          const from = SLOT_MOTION[slot];
          return (
            <motion.div
              key={`${played.playerId}-${played.card.id}`}
              layoutId={`mindi-card-${played.card.id}`}
              className={`mindi-trick-card from-${slot} ${winningId === played.card.id ? 'is-winning' : ''}`}
              initial={reduce ? false : { opacity: 0, scale: 0.72, x: from.x * 1.6, y: from.y * 1.6, rotate: from.rotate * 1.4 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: collecting ? from.x * 2.1 : from.x,
                y: collecting ? from.y * 2.1 : from.y,
                rotate: from.rotate,
              }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <MindiCardView
                card={played.card}
                size="md"
                state={winningId === played.card.id ? 'winning' : 'played'}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      {!cards.length && !dealing && (
        <p className="mindi-felt-hint">{isMyTurn ? 'Your lead' : 'Waiting for the next card'}</p>
      )}
      {tenFlash && <span className="mindi-ten-flash">10 captured</span>}
    </div>
  );
}
