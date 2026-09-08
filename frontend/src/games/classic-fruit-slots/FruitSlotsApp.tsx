'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { SlotMachine } from './components/SlotMachine';
import { useSlotGame } from './useSlotGame';

interface FruitSlotsAppProps {
  variant?: 'hub' | 'play';
}

const PLAY_PATH = '/games/classic-fruit-slots/play';

function isSignedIn(token: string | null, isAuthenticated: boolean): boolean {
  return (
    isAuthenticated ||
    !!token ||
    (typeof window !== 'undefined' && !!localStorage.getItem('token'))
  );
}

export function FruitSlotsApp({ variant = 'play' }: FruitSlotsAppProps) {
  const { token, isAuthenticated, isLoading } = useAuthStore();
  const signedIn = isSignedIn(token, isAuthenticated);

  if (isLoading && !signedIn) {
    return (
      <div className="cfs-root">
        <div className="cfs-ambience" aria-hidden />
        <div className="cfs-nav-wrap cfs-gate">
          <div className="cfs-spin-loader" aria-label="Loading Classic Fruit Slots" />
        </div>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="cfs-root">
        <div className="cfs-ambience" aria-hidden />
        <div className="cfs-nav-wrap cfs-gate">
          <p className="cfs-kicker">GAMEHUB Casino</p>
          <h1>Classic Fruit Slots</h1>
          <p className="cfs-sub">Sign in to join a session and spin with your coin balance.</p>
          <div className="cfs-gate-actions">
            <Link href={`/login?next=${encodeURIComponent(PLAY_PATH)}`} className="cfs-link-btn is-primary">
              Sign in to play
            </Link>
            <Link href="/games" className="cfs-link-btn">
              <ArrowLeft className="w-4 h-4" />
              Back to Games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <FruitSlotsInner variant={variant} />;
}

function FruitSlotsInner({ variant }: FruitSlotsAppProps) {
  const game = useSlotGame();
  const [panel, setPanel] = useState<'paytable' | 'history' | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      event.preventDefault();
      if (!game.locked) game.spin();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [game.locked, game.spin]);

  return (
    <div className="cfs-root" data-variant={variant}>
      <div className="cfs-ambience" aria-hidden />
      <div className="cfs-vignette" aria-hidden />
      <nav className="cfs-nav">
        <Link href="/games" className="cfs-link-btn">
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </Link>
        <div className="cfs-nav-right">
          <button
            type="button"
            className="cfs-icon-btn"
            onClick={game.toggleMuted}
            aria-label={game.muted ? 'Unmute' : 'Mute'}
          >
            {game.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <Link href="/dashboard" className="cfs-link-btn">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="cfs-stage">
        <SlotMachine
          reels={game.reels}
          resultReels={game.resultReels}
          spinning={game.spinning}
          winning={game.showWinBurst}
          winningLines={game.winningLines}
          paylines={game.config.paylines}
          symbols={game.config.symbols}
          history={game.history}
          winAmount={game.currentWin}
          showWinBurst={game.showWinBurst}
          balance={game.balance}
          bet={game.bet}
          lastWin={game.lastWin}
          connected={game.isGameConnected && game.joined}
          locked={game.locked}
          autoSpin={game.autoSpin}
          panel={panel}
          minBet={game.config.minBet}
          maxBet={game.config.maxBet}
          step={game.config.betStep}
          presets={game.config.betPresets}
          onBetChange={game.setBet}
          onSpin={game.spin}
          onAllStopped={game.finishSpin}
          onToggleAuto={game.toggleAutoSpin}
          onTogglePanel={(next) => setPanel((current) => (current === next ? null : next))}
          onClosePanel={() => setPanel(null)}
        />

        {game.error && <p className="cfs-error">{game.error}</p>}
        {!game.isGameConnected && <p className="cfs-status">Reconnecting to the game server…</p>}
        {game.isGameConnected && !game.joined && <p className="cfs-status">Joining Classic Fruit Slots…</p>}
      </div>
    </div>
  );
}
