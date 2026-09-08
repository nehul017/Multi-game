'use client';

import { ArrowLeft, Coins, Users } from 'lucide-react';
import type { LobbyTable, PokerGameType, PokerVariantInfo } from '../types';
import { VARIANT_COPY } from '../types';

const TABS: Array<PokerGameType | 'all'> = ['all', 'texas-holdem', 'omaha', 'omaha-hi-lo', 'five-card-draw'];

export function variantName(
  gameType: PokerGameType,
  variants?: Record<string, PokerVariantInfo> | null
): string {
  return variants?.[gameType]?.name || VARIANT_COPY[gameType].name;
}

export function streetLabel(street?: string): string {
  if (!street) return 'Waiting';
  return street
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function LiveTableCard({
  table,
  variantLabel,
  busy,
  onJoin,
}: {
  table: LobbyTable;
  variantLabel: string;
  busy?: boolean;
  onJoin: (tableId: string) => void;
}) {
  const fill = table.maxSeats ? Math.min(100, (table.playersSeated / table.maxSeats) * 100) : 0;
  const seats = table.players ?? [];

  return (
    <article className="pk-lobby-card">
      <div className="pk-lobby-card-top">
        <p className="pk-kicker">{variantLabel}</p>
        <span className={`pk-lobby-status is-${table.status}`}>
          {table.status} · cash
        </span>
      </div>
      <h2>{table.name}</h2>
      <p className="pk-lobby-blinds">
        Blinds {table.blinds.small}/{table.blinds.big}
        {typeof table.pot === 'number' && table.pot > 0 ? ` · Pot ${table.pot}` : ''}
      </p>
      <p className="pk-lobby-street">
        {streetLabel(table.street)}
        {table.handNumber ? ` · Hand #${table.handNumber}` : ''}
      </p>
      <div className="pk-occupancy">
        <div className="pk-occupancy-meta">
          <Users className="w-3.5 h-3.5" />
          {table.playersSeated} / {table.maxSeats} seated
        </div>
        <div className="pk-occupancy-track" aria-hidden>
          <span style={{ width: `${fill}%` }} />
        </div>
      </div>
      {seats.length > 0 && (
        <ul className="pk-seat-list">
          {seats.map((seat) => (
            <li key={`${table.tableId}-${seat.seatIndex}-${seat.username}`}>
              <b>{seat.username}</b>
              <span>{seat.chips} chips</span>
            </li>
          ))}
        </ul>
      )}
      <p className="pk-lobby-range">Buy-in {table.buyIn.min}–{table.buyIn.max}</p>
      <button type="button" className="pk-btn is-gold" disabled={busy} onClick={() => onJoin(table.tableId)}>
        Join table
      </button>
    </article>
  );
}

export function PokerLobby({
  tables,
  variants,
  mode,
  buyIn,
  busy,
  onMode,
  onBuyIn,
  onJoin,
  onBack,
}: {
  tables: LobbyTable[];
  variants?: Record<string, PokerVariantInfo> | null;
  mode: PokerGameType | 'all';
  buyIn: number;
  busy?: boolean;
  onMode: (mode: PokerGameType | 'all') => void;
  onBuyIn: (value: number) => void;
  onJoin: (tableId: string) => void;
  onBack: () => void;
}) {
  const cashTables = tables.filter((table) => !table.fillBots);
  const visible = mode === 'all' ? cashTables : cashTables.filter((table) => table.gameType === mode);
  const minBuy = visible.reduce((min, table) => Math.min(min, table.buyIn.min), 100);
  const maxBuy = visible.reduce((max, table) => Math.max(max, table.buyIn.max), 2000);

  return (
    <section className="pk-lobby">
      <div className="pk-lobby-head">
        <button type="button" className="pk-btn is-ghost pk-back" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Floor
        </button>
        <div>
          <p className="pk-kicker">Live tables</p>
          <h1>Choose a seat</h1>
          <p className="pk-lobby-lead">
            {visible.length} open {visible.length === 1 ? 'table' : 'tables'}
            {mode === 'all' ? '' : ` · ${variantName(mode, variants)}`}
            . Buy-in uses your coin balance.
          </p>
        </div>
        <label className="pk-buyin">
          <span>
            <Coins className="w-3.5 h-3.5" />
            Buy-in
          </span>
          <input
            type="number"
            value={buyIn}
            min={minBuy}
            max={maxBuy}
            onChange={(event) => onBuyIn(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="pk-tabs" role="tablist" aria-label="Poker variants">
        {TABS.map((tab) => {
          const count = tab === 'all' ? cashTables.length : cashTables.filter((table) => table.gameType === tab).length;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={mode === tab}
              className={mode === tab ? 'is-active' : ''}
              onClick={() => onMode(tab)}
            >
              {tab === 'all' ? 'All tables' : variantName(tab, variants)}
              <em>{count}</em>
            </button>
          );
        })}
      </div>

      <div className="pk-table-list">
        {visible.map((table) => (
          <LiveTableCard
            key={table.tableId}
            table={table}
            variantLabel={variantName(table.gameType, variants)}
            busy={busy}
            onJoin={onJoin}
          />
        ))}
        {visible.length === 0 && (
          <div className="pk-empty">
            <p>No open cash tables for this filter.</p>
          </div>
        )}
      </div>
    </section>
  );
}
