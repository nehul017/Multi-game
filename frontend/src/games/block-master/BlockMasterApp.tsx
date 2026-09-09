'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useGameSession } from '@/games/sdk';
import { GameBoard } from './components/GameBoard';
import { GameControls } from './components/GameControls';
import { GameOverOverlay } from './components/GameOverOverlay';
import { GameStats } from './components/GameStats';
import { PauseOverlay } from './components/PauseOverlay';
import { PiecePreview } from './components/PiecePreview';
import { ReadyScreen } from './components/ReadyScreen';
import { playBlockMasterCue } from './audio';
import { BlockMasterEngine } from './logic';
import type { BlockMasterSnapshot } from './types';

interface BlockMasterAppProps {
  variant?: 'hub' | 'play';
}

const MOVE_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'Spacebar']);
const REPEAT_DELAY = 160;
const REPEAT_MS = 40;

export function BlockMasterApp({ variant = 'hub' }: BlockMasterAppProps) {
  return (
    <AuthGuard>
      <BlockMasterInner variant={variant} />
    </AuthGuard>
  );
}

function BlockMasterInner({ variant = 'hub' }: BlockMasterAppProps) {
  const [engine] = useState(() => new BlockMasterEngine());
  const { start, complete, error: saveError, saving, lastResult } = useGameSession('block-master');
  const startedAt = useRef(0);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [snap, setSnap] = useState<BlockMasterSnapshot>(() => engine.getSnapshot());
  const snapRef = useRef(snap);
  const repeatRef = useRef<number | null>(null);
  const heldKey = useRef<string | null>(null);
  const sync = useCallback(() => {
    const next = engine.getSnapshot();
    snapRef.current = next;
    setSnap(next);
  }, [engine]);

  useEffect(() => engine.subscribe(sync), [engine, sync]);

  const prevSnap = useRef(snap);
  useEffect(() => {
    const prev = prevSnap.current;
    if (snap.clearTick !== prev.clearTick) playBlockMasterCue('clear');
    if (snap.dropTick !== prev.dropTick) playBlockMasterCue('drop');
    if (snap.levelTick !== prev.levelTick) playBlockMasterCue('level');
    if (snap.status === 'over' && prev.status !== 'over') {
      playBlockMasterCue('over');
      void complete({
        score: snap.score,
        lines: snap.lines,
        level: snap.level,
        durationMs: startedAt.current ? Date.now() - startedAt.current : 0,
        result: 'completed',
      }).catch(() => undefined);
    }
    prevSnap.current = snap;
  }, [snap, complete]);

  useEffect(() => {
    if (snap.status !== 'playing') return undefined;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      engine.advance(now - last);
      last = now;
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, [engine, snap.status]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && snapRef.current.status === 'playing') {
        engine.pause();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [engine]);

  const stopRepeat = useCallback(() => {
    if (repeatRef.current !== null) {
      window.clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
    heldKey.current = null;
  }, []);

  const runKey = useCallback(
    (key: string) => {
      switch (key) {
        case 'ArrowLeft':
          engine.move(-1);
          break;
        case 'ArrowRight':
          engine.move(1);
          break;
        case 'ArrowDown':
          engine.softDrop();
          break;
        case 'ArrowUp':
          engine.rotate(1);
          break;
        case ' ':
        case 'Spacebar':
          engine.hardDrop();
          break;
        case 'c':
        case 'C':
          engine.holdPiece();
          break;
        case 'p':
        case 'P':
          engine.togglePause();
          break;
        case 'r':
        case 'R':
          break;
        default:
          break;
      }
    },
    [engine]
  );

  const beginRun = useCallback(
    async (restart = false) => {
      if (starting) return;
      setStarting(true);
      setStartError(null);
      try {
        await start();
        startedAt.current = Date.now();
        if (restart || snapRef.current.status === 'over' || snapRef.current.status === 'playing') {
          engine.restart();
        } else {
          engine.start();
        }
      } catch (err) {
        setStartError(err instanceof Error ? err.message : 'Could not start game session');
      } finally {
        setStarting(false);
      }
    },
    [engine, start, starting]
  );

  useEffect(() => {
    const repeating = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown']);

    const onDown = (event: KeyboardEvent) => {
      const status = snapRef.current.status;
      const key = event.key;

      if (status === 'ready' && (key === 'Enter' || key === ' ')) {
        event.preventDefault();
        void beginRun();
        return;
      }

      if (status === 'over' && (key === 'r' || key === 'R' || key === 'Enter')) {
        event.preventDefault();
        void beginRun(true);
        return;
      }

      if (status !== 'playing' && status !== 'paused') return;

      const watched =
        MOVE_KEYS.has(key) || key === 'p' || key === 'P' || key === 'r' || key === 'R' || key === 'c' || key === 'C';
      if (!watched) return;
      event.preventDefault();
      if (event.repeat) return;

      if (status === 'paused' && key !== 'p' && key !== 'P' && key !== 'r' && key !== 'R') return;

      if (key === 'r' || key === 'R') {
        void beginRun(true);
        return;
      }

      runKey(key);

      if (status === 'playing' && repeating.has(key)) {
        stopRepeat();
        heldKey.current = key;
        const startedAt = Date.now();
        repeatRef.current = window.setInterval(() => {
          if (heldKey.current !== key) return;
          if (Date.now() - startedAt < REPEAT_DELAY) return;
          runKey(key);
        }, REPEAT_MS);
      }
    };

    const onUp = (event: KeyboardEvent) => {
      if (heldKey.current === event.key) stopRepeat();
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', stopRepeat);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', stopRepeat);
      stopRepeat();
    };
  }, [engine, runKey, stopRepeat, beginRun]);

  const playing = snap.status === 'playing';
  const showControls = playing || snap.status === 'paused';

  return (
    <div className="bm-root" data-variant={variant}>
      <div className="bm-shell">
        <header className="bm-header">
          <div className="bm-heading">
            <p className="bm-kicker">GAMEHUB</p>
            <h1>Block Master</h1>
            <p className="bm-sub">Stack, rotate, and clear under rising pressure.</p>
          </div>
          <div className="bm-header-actions">
            <Link href="/games">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}>
                Back to Games
              </Button>
            </Link>
            {showControls && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => engine.togglePause()}
                  leftIcon={<Pause className="w-4 h-4" aria-hidden="true" />}
                  aria-label={snap.status === 'paused' ? 'Resume game' : 'Pause game'}
                >
                  {snap.status === 'paused' ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void beginRun(true)}
                  leftIcon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}
                  aria-label="Restart game"
                >
                  Restart
                </Button>
              </>
            )}
          </div>
        </header>

        <div className="bm-layout">
          <div className="bm-side bm-side-hold">
            <PiecePreview type={snap.hold} label="Hold" muted={!snap.canHold} />
          </div>

          <div className="bm-stage">
            <GameBoard
              board={snap.board}
              active={snap.active}
              clearingRows={snap.clearingRows}
              spawnTick={snap.spawnTick}
              dropTick={snap.dropTick}
            />
            <GameStats
              score={snap.score}
              level={snap.level}
              lines={snap.lines}
              highScore={snap.highScore}
              levelTick={snap.levelTick}
            />
          </div>

          <div className="bm-side bm-side-next">
            <PiecePreview type={snap.next} label="Next" />
          </div>
        </div>

        {showControls && (
          <GameControls
            disabled={!playing}
            canHold={snap.canHold}
            onLeft={() => engine.move(-1)}
            onRight={() => engine.move(1)}
            onRotate={() => engine.rotate(1)}
            onSoftDrop={() => engine.softDrop()}
            onHardDrop={() => engine.hardDrop()}
            onHold={() => engine.holdPiece()}
          />
        )}

        <p className="bm-desktop-hint">
          ← → move · ↑ rotate · ↓ soft drop · Space hard drop · C hold · P pause · R restart
        </p>
      </div>

      {snap.status === 'ready' && (
        <ReadyScreen
          highScore={snap.highScore}
          onStart={() => void beginRun()}
          error={startError}
          starting={starting}
        />
      )}
      {snap.status === 'paused' && (
        <PauseOverlay onResume={() => engine.resume()} onRestart={() => void beginRun(true)} />
      )}
      {snap.status === 'over' && (
        <GameOverOverlay
          score={snap.score}
          level={snap.level}
          lines={snap.lines}
          highScore={snap.highScore}
          isNewHigh={snap.isNewHigh}
          onPlayAgain={() => void beginRun(true)}
          saving={saving}
          saveError={saveError}
          coins={lastResult?.rewards?.coins}
          xp={lastResult?.rewards?.xp}
        />
      )}
    </div>
  );
}
