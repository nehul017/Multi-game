'use client';

import type { PokerGameType, PokerVariantInfo } from '../types';

export function PokerRulesModal({
  open,
  variant,
  info,
  onClose,
}: {
  open: boolean;
  variant?: PokerGameType;
  info?: PokerVariantInfo;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="pk-modal" role="dialog">
      <div className="pk-modal-card">
        <header>
          <h2>{info?.name || variant || 'Poker rules'}</h2>
          <button type="button" onClick={onClose}>Close</button>
        </header>
        <p>{info?.description}</p>
        <ul>
          {info?.bettingRounds.map((round) => (
            <li key={round}>{round}</li>
          ))}
        </ul>
        <p>{info?.evaluation}</p>
        <p>{info?.potHandling}</p>
      </div>
    </div>
  );
}
