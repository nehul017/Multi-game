'use client';

import type { PokerHistoryItem } from '../types';
import { VARIANT_COPY } from '../types';

export function PokerHistory({
  items,
  open,
  onClose,
}: {
  items: PokerHistoryItem[];
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <aside className="pk-drawer">
      <header>
        <h2>Hand history</h2>
        <button type="button" onClick={onClose}>Close</button>
      </header>
      <div className="pk-drawer-body">
        {items.map((item) => (
          <article key={item.handId}>
            <p className="pk-kicker">{VARIANT_COPY[item.gameType].name}</p>
            <h3>{item.handId.slice(0, 8)}</h3>
            <p>Players: {item.players.map((player) => player.username).join(', ')}</p>
            <p>Board: {item.communityCards.join(' ') || '—'}</p>
            <ul>
              {item.actions.slice(0, 12).map((action, index) => (
                <li key={`${action.timestamp}-${index}`}>
                  {action.street} · {action.action} {action.amount || ''}
                </li>
              ))}
            </ul>
          </article>
        ))}
        {items.length === 0 && <p>No completed hands yet.</p>}
      </div>
    </aside>
  );
}
