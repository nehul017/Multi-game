'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { PokerHistory } from './components/PokerHistory';
import { PokerLobby } from './components/PokerLobby';
import { PokerModeSelector } from './components/PokerModeSelector';
import { PokerRulesModal } from './components/PokerRulesModal';
import { PokerTable } from './components/PokerTable';
import { PokerTableHeader } from './components/PokerTableHeader';
import { usePokerGame } from './usePokerGame';

interface PokerAppProps {
  variant?: 'hub' | 'play';
}

function isSignedIn(token: string | null, isAuthenticated: boolean): boolean {
  return (
    isAuthenticated ||
    !!token ||
    (typeof window !== 'undefined' && !!localStorage.getItem('token'))
  );
}

export function PokerApp({ variant = 'play' }: PokerAppProps) {
  const { token, isAuthenticated, isLoading } = useAuthStore();
  const signedIn = isSignedIn(token, isAuthenticated);

  if (isLoading && !signedIn) {
    return (
      <div className="pk-root">
        <div className="pk-ambience" />
        <div className="pk-gate">Opening the poker room…</div>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="pk-root">
        <div className="pk-ambience" />
        <div className="pk-gate">
          <p className="pk-kicker">GAMEHUB Casino</p>
          <h1>Poker Room</h1>
          <p>Sign in to sit at a live table with your coin balance.</p>
          <div className="pk-gate-actions">
            <Link href={`/login?next=${encodeURIComponent('/games/poker/play')}`} className="pk-btn is-gold">
              Sign in to play
            </Link>
            <Link href="/games" className="pk-btn is-ghost">
              <ArrowLeft className="w-4 h-4" />
              Back to Games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="pk-root">
          <div className="pk-ambience" />
          <div className="pk-gate">Opening the poker room…</div>
        </div>
      }
    >
      <PokerInner variant={variant} />
    </Suspense>
  );
}

function PokerInner({ variant }: PokerAppProps) {
  const game = usePokerGame();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div className={`pk-root ${game.view === 'table' ? 'is-playing' : ''}`}>
      <div className="pk-ambience" />
      <nav className="pk-nav">
        <Link href="/games" className="pk-nav-back">
          <ArrowLeft className="w-4 h-4" />
          Games
        </Link>
        <p className="pk-nav-brand">
          <span aria-hidden>♠</span>
          Poker Room
        </p>
        <div className="pk-nav-meta">
          {game.reconnecting && <em>Reconnecting…</em>}
          <span className="pk-coin-pill">{game.balance.toLocaleString()} coins</span>
        </div>
      </nav>

      {game.error && (
        <div className="pk-error">
          {game.error}
          <button type="button" onClick={() => game.setError(null)}>Dismiss</button>
        </div>
      )}

      {game.view === 'modes' && (
        <PokerModeSelector
          variants={game.variants}
          config={game.config}
          tables={game.tables}
          busy={game.busy}
          onPlay={(type) => game.quickJoin(type)}
          onBrowse={(type) => game.selectMode(type)}
          onJoin={(tableId) => game.joinTable(tableId)}
        />
      )}

      {game.view === 'lobby' && (
        <PokerLobby
          tables={game.tables}
          variants={game.variants}
          mode={game.mode}
          buyIn={game.buyIn}
          busy={game.busy}
          onMode={game.selectMode}
          onBuyIn={game.setBuyIn}
          onJoin={(tableId) => game.joinTable(tableId)}
          onBack={() => game.setView('modes')}
        />
      )}

      {game.view === 'table' && game.table && (
        <>
          <PokerTableHeader
            table={game.table}
            onLeave={game.leaveTable}
            onHistory={() => {
              void game.loadHistory();
              setHistoryOpen(true);
            }}
            onRules={() => setRulesOpen(true)}
          />
          <PokerTable
            table={game.table}
            myId={game.myId}
            isMyTurn={game.isMyTurn}
            discardIndexes={game.discardIndexes}
            onToggleDiscard={game.toggleDiscard}
            onAction={game.sendAction}
            onDraw={game.sendDraw}
            busy={game.busy}
          />
          {!game.me && (
            <div className="pk-gate">
              <p>Sit down to be dealt in.</p>
              <button
                type="button"
                className="pk-btn is-gold"
                disabled={game.busy}
                onClick={() => game.joinTable(game.table!.tableId)}
              >
                Sit · {game.buyIn} chips
              </button>
            </div>
          )}
        </>
      )}

      {game.view === 'table' && !game.table && (
        <div className="pk-gate">{variant === 'hub' ? 'Choosing a table…' : 'Joining table…'}</div>
      )}

      <PokerHistory items={game.history} open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <PokerRulesModal
        open={rulesOpen}
        variant={game.table?.gameType}
        info={game.table ? game.variants?.[game.table.gameType] : undefined}
        onClose={() => setRulesOpen(false)}
      />
    </div>
  );
}
