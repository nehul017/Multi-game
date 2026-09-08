'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Coins, Play, Sparkles, Table2, Users } from 'lucide-react';
import type { LobbyTable, PokerCard, PokerGameType, PokerPublicConfig, PokerVariantInfo } from '../types';
import { VARIANT_COPY } from '../types';
import { LiveTableCard, variantName } from './PokerLobby';

const ORDER: PokerGameType[] = ['texas-holdem', 'omaha', 'omaha-hi-lo', 'five-card-draw'];

const SUIT_PATH: Record<PokerCard['suit'], string> = {
  spades:
    'M12 2C9 7 5.5 10.2 5.5 13.4c0 2.6 1.9 4.2 4.1 4.4-.3 1.1-.9 2.1-1.9 2.8h8.6c-1-.7-1.6-1.7-1.9-2.8 2.2-.2 4.1-1.8 4.1-4.4C18.5 10.2 15 7 12 2z',
  hearts:
    'M12 21S3.2 14.4 3.2 8.8C3.2 5.9 5.4 4 8 4c1.7 0 3.2.9 4 2.2C12.8 4.9 14.3 4 16 4c2.6 0 4.8 1.9 4.8 4.8C20.8 14.4 12 21 12 21z',
  diamonds: 'M12 2l7 10-7 10-7-10 7-10z',
  clubs:
    'M12 3.2c-1.9 0-3.5 1.6-3.5 3.6 0 .6.1 1.1.4 1.6-1.7-.3-3.3.9-3.3 2.7 0 1.8 1.5 3.1 3.3 3.1.5 0 1-.1 1.4-.3-.2 1.1-.8 2.1-1.8 2.8h6.9c-1-.7-1.6-1.7-1.8-2.8.4.2.9.3 1.4.3 1.8 0 3.3-1.3 3.3-3.1 0-1.8-1.6-3-3.3-2.7.3-.5.4-1 .4-1.6 0-2-1.6-3.6-3.5-3.6z',
};

const SUITS: PokerCard['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS = ['A', 'K', 'Q', 'J', '10', '9', '8'];

function SuitIcon({ suit, className }: { suit: PokerCard['suit']; className?: string }) {
  const red = suit === 'hearts' || suit === 'diamonds';
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill={red ? '#c23b2e' : 'currentColor'}>
      <path d={SUIT_PATH[suit]} />
    </svg>
  );
}

function FanCard({
  rank,
  suit,
  index,
  total,
}: {
  rank: string;
  suit: PokerCard['suit'];
  index: number;
  total: number;
}) {
  const mid = (total - 1) / 2;
  const tilt = (index - mid) * 9;
  const lift = Math.abs(index - mid) * 3;
  const red = suit === 'hearts' || suit === 'diamonds';

  return (
    <span
      className={`pk-fan-card ${red ? 'is-red' : 'is-black'}`}
      style={{
        transform: `translateX(${(index - mid) * 16}px) translateY(${lift}px) rotate(${tilt}deg)`,
        zIndex: index + 1,
      }}
    >
      <b>{rank}</b>
      <SuitIcon suit={suit} />
    </span>
  );
}

function holePreview(count: number, suit: PokerCard['suit']) {
  return Array.from({ length: Math.max(1, count) }, (_, index) => ({
    rank: RANKS[index % RANKS.length],
    suit: SUITS[(SUITS.indexOf(suit) + index) % SUITS.length],
  }));
}

export function PokerModeSelector({
  variants,
  config,
  tables,
  busy,
  onPlay,
  onBrowse,
  onJoin,
}: {
  variants: Record<string, PokerVariantInfo> | null;
  config: PokerPublicConfig | null;
  tables: LobbyTable[];
  busy?: boolean;
  onPlay: (type: PokerGameType) => void;
  onBrowse: (type: PokerGameType | 'all') => void;
  onJoin: (tableId: string) => void;
}) {
  const ids = (variants ? (Object.keys(variants) as PokerGameType[]) : ORDER).sort(
    (a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)
  );
  const cashTables = tables.filter((table) => !table.fillBots);
  const seated = cashTables.reduce((sum, table) => sum + table.playersSeated, 0);
  const hottest = [...cashTables].sort((a, b) => b.playersSeated - a.playersSeated)[0];
  const featuredId = hottest?.gameType || ids[0];

  return (
    <section className="pk-modes">
      <div className="pk-modes-atmosphere" aria-hidden>
        <span className="pk-orb pk-orb-gold" />
        <span className="pk-orb pk-orb-felt" />
        <span className="pk-suit-watermark is-tl">♠</span>
        <span className="pk-suit-watermark is-br">♦</span>
      </div>

      <div className="pk-hero">
        <motion.div
          className="pk-hero-copy"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="pk-kicker">Casino Floor</p>
          <h1>{config?.name || 'Poker Room'}</h1>
          <p className="pk-hero-lead">
            {ids.length} variants from the live catalog. {cashTables.length} cash tables are open right now.
          </p>
          <div className="pk-hero-stats">
            <span>
              <Sparkles className="w-3.5 h-3.5" />
              {ids.length} variants
            </span>
            <span>
              <Table2 className="w-3.5 h-3.5" />
              {cashTables.length} cash tables
            </span>
            <span>
              <Users className="w-3.5 h-3.5" />
              {seated} seated
            </span>
            {config?.seats?.length ? (
              <span>
                Seats {config.seats[0]}–{config.seats[config.seats.length - 1]}
              </span>
            ) : null}
          </div>
          <div className="pk-hero-actions">
            <button
              type="button"
              className="pk-btn is-gold"
              onClick={() => onPlay(featuredId || 'texas-holdem')}
              disabled={busy || !featuredId}
            >
              <Play className="w-4 h-4" />
              {hottest ? `Join ${hottest.name}` : 'Quick play'}
            </button>
            <button type="button" className="pk-btn is-ghost" onClick={() => onBrowse('all')}>
              Browse all tables
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {hottest && (
          <motion.aside
            className="pk-hero-felt"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <div className="pk-hero-rail">
              <div className="pk-hero-felt-inner">
                <div className="pk-hero-community">
                  {holePreview(Math.min(3, variants?.[hottest.gameType]?.holeCards || 2), 'spades').map((card, index) => (
                    <FanCard key={`${card.rank}-${index}`} rank={card.rank} suit={card.suit} index={index} total={3} />
                  ))}
                </div>
                <p className="pk-hero-felt-label">{hottest.name}</p>
                <p className="pk-hero-felt-meta">
                  {hottest.blinds.small}/{hottest.blinds.big} · {hottest.playersSeated}/{hottest.maxSeats} seated
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </div>

      <div className="pk-mode-grid">
        {ids.map((id, order) => {
          const info = variants?.[id];
          const holeCards = info?.holeCards ?? 2;
          const variantTables = cashTables.filter((table) => table.gameType === id);
          const players = variantTables.reduce((sum, table) => sum + table.playersSeated, 0);
          const blinds = variantTables[0]?.blinds;
          const buyIn = variantTables[0]?.buyIn;
          const preview = holePreview(holeCards, SUITS[order % SUITS.length]);

          return (
            <motion.article
              key={id}
              className={`pk-mode-card ${id === featuredId ? 'is-featured' : ''}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 + order * 0.06 }}
            >
              <div className="pk-mode-card-top">
                <span className="pk-mode-badge">
                  {variantTables.length} {variantTables.length === 1 ? 'table' : 'tables'}
                </span>
                <span className="pk-mode-diff">{players} seated</span>
              </div>

              <div className="pk-mode-fan" aria-hidden>
                {preview.map((card, index) => (
                  <FanCard key={`${id}-${card.rank}-${index}`} rank={card.rank} suit={card.suit} index={index} total={preview.length} />
                ))}
                <SuitIcon suit={SUITS[order % SUITS.length]} className="pk-mode-watermark" />
              </div>

              <h2>{info?.name || VARIANT_COPY[id].name}</h2>
              <p className="pk-mode-tagline">{info?.tagline || VARIANT_COPY[id].tagline}</p>
              {info?.description && <p className="pk-mode-desc">{info.description}</p>}

              <ul className="pk-mode-facts">
                <li>
                  <b>{holeCards}</b>
                  <span>hole cards</span>
                </li>
                <li>
                  <b>{info?.communityCards ?? 0}</b>
                  <span>community</span>
                </li>
                <li>
                  <b>{blinds ? `${blinds.small}/${blinds.big}` : '—'}</b>
                  <span>blinds</span>
                </li>
              </ul>

              {buyIn && (
                <p className="pk-mode-buyin">
                  Buy-in {buyIn.min}–{buyIn.max}
                </p>
              )}

              {info?.bettingRounds?.length ? (
                <ul className="pk-round-list">
                  {info.bettingRounds.map((round) => (
                    <li key={round}>{round}</li>
                  ))}
                </ul>
              ) : null}

              {info?.evaluation && <p className="pk-mode-rule">{info.evaluation}</p>}
              {info?.potHandling && <p className="pk-mode-pot">{info.potHandling}</p>}

              {info?.availableActions?.length ? (
                <p className="pk-mode-actions-list">{info.availableActions.join(' · ')}</p>
              ) : null}

              <div className="pk-mode-actions">
                <button type="button" className="pk-btn is-gold" disabled={busy} onClick={() => onPlay(id)}>
                  <Play className="w-4 h-4" />
                  Play now
                </button>
                <button type="button" className="pk-btn is-ghost" onClick={() => onBrowse(id)}>
                  View tables
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>

      <div className="pk-live-block">
        <div className="pk-live-head">
          <div>
            <p className="pk-kicker">Live now</p>
            <h2>All open tables</h2>
          </div>
          <button type="button" className="pk-btn is-ghost" onClick={() => onBrowse('all')}>
            Full lobby
          </button>
        </div>
        <div className="pk-table-list">
          {cashTables.map((table) => (
            <LiveTableCard
              key={table.tableId}
              table={table}
              variantLabel={variantName(table.gameType, variants)}
              busy={busy}
              onJoin={onJoin}
            />
          ))}
          {cashTables.length === 0 && (
            <div className="pk-empty">
              <p>No live cash tables yet.</p>
            </div>
          )}
        </div>
      </div>

      <p className="pk-modes-note">
        <Coins className="w-4 h-4" />
        Sit-down stacks come from your coin wallet. Empty seats stay open for real players.
      </p>
    </section>
  );
}
