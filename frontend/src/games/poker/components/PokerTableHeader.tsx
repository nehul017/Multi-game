'use client';

import { VARIANT_COPY, type PokerGameState } from '../types';

function streetLabel(street: string): string {
  return street
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function PokerTableHeader({
  table,
  onLeave,
  onHistory,
  onRules,
}: {
  table: PokerGameState;
  onLeave: () => void;
  onHistory: () => void;
  onRules: () => void;
}) {
  return (
    <header className="pk-table-header">
      <div className="pk-hud">
        <p className="pk-kicker">{VARIANT_COPY[table.gameType].name}</p>
        <h1>{table.name}</h1>
        <ul className="pk-hud-stats">
          <li>Blinds {table.blinds.small}/{table.blinds.big}</li>
          <li>Hand #{table.handNumber || '—'}</li>
          <li>{streetLabel(table.street)}</li>
          <li>Pot {table.pot.toLocaleString()}</li>
          <li>
            {table.players.length}/{table.maxSeats} seated
          </li>
        </ul>
      </div>
      <div className="pk-table-header-actions">
        <button type="button" onClick={onRules}>Rules</button>
        <button type="button" onClick={onHistory}>History</button>
        <button type="button" className="is-danger" onClick={onLeave}>Leave</button>
      </div>
    </header>
  );
}
