'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Map, RotateCcw, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useGameSession } from '@/games/sdk';
import { AtlasMap } from './components/AtlasMap';
import { PuzzleBoard } from './components/PuzzleBoard';
import { PuzzleHUD } from './components/PuzzleHUD';
import { ReadyScreen } from './components/ReadyScreen';
import { ResultOverlay } from './components/ResultOverlay';
import { PuzzleWorldEngine } from './logic';
import { RELIC_PLURAL } from './rooms';
import type { PuzzleWorldSnapshot } from './types';

interface PuzzleWorldAppProps {
  variant?: 'hub' | 'play';
}

export function PuzzleWorldApp({ variant = 'hub' }: PuzzleWorldAppProps) {
  return (
    <AuthGuard>
      <PuzzleWorldInner variant={variant} />
    </AuthGuard>
  );
}

function PuzzleWorldInner({ variant = 'hub' }: PuzzleWorldAppProps) {
  const [engine] = useState(() => new PuzzleWorldEngine());
  const { start, complete, error: saveError, saving, lastResult } = useGameSession('puzzle-world');
  const startedAt = useRef(0);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [now, setNow] = useState(0);
  const [snap, setSnap] = useState<PuzzleWorldSnapshot>(() => engine.getSnapshot());
  const snapRef = useRef(snap);

  const sync = useCallback(() => {
    const next = engine.getSnapshot();
    snapRef.current = next;
    setSnap(next);
  }, [engine]);

  useEffect(() => engine.subscribe(sync), [engine, sync]);

  useEffect(() => {
    if (snap.status !== 'atlas' && snap.status !== 'room' && snap.status !== 'cleared') return undefined;
    const tick = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(tick);
  }, [snap.status]);

  const prevSnap = useRef(snap);
  useEffect(() => {
    const prev = prevSnap.current;
    if (snap.status === 'over' && prev.status !== 'over') {
      void complete({
        score: snap.score,
        lines: snap.roomsSolved,
        level: Math.max(1, snap.roomsSolved),
        moves: snap.moves,
        durationMs: startedAt.current ? Date.now() - startedAt.current : 0,
        result: 'completed',
      }).catch(() => undefined);
    }
    prevSnap.current = snap;
  }, [snap, complete]);

  const beginRun = useCallback(
    async (restart = false) => {
      if (starting) return;
      setStarting(true);
      setStartError(null);
      try {
        await start();
        startedAt.current = Date.now();
        if (restart) engine.restart();
        else engine.start();
      } catch (err) {
        setStartError(err instanceof Error ? err.message : 'Could not start game session');
      } finally {
        setStarting(false);
      }
    },
    [engine, start, starting]
  );

  const rotateSelected = useCallback(() => {
    const selected = snapRef.current.selected;
    if (!selected) return;
    engine.rotate(selected.x, selected.y);
  }, [engine]);

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      const status = snapRef.current.status;
      const key = event.key;

      if (status === 'ready' && (key === 'Enter' || key === ' ')) {
        event.preventDefault();
        void beginRun();
        return;
      }

      if (status === 'over' && (key === 'Enter' || key === 'r' || key === 'R')) {
        event.preventDefault();
        void beginRun(true);
        return;
      }

      if (status === 'cleared' && (key === 'Enter' || key === ' ')) {
        event.preventDefault();
        engine.backToAtlas();
        return;
      }

      if (status !== 'room' && status !== 'atlas') return;

      if (status === 'atlas' && key >= '1' && key <= '9') {
        engine.enterRoom(key);
        return;
      }

      if (status !== 'room') return;

      if (key === 'ArrowLeft') {
        event.preventDefault();
        engine.moveSelection(-1, 0);
      } else if (key === 'ArrowRight') {
        event.preventDefault();
        engine.moveSelection(1, 0);
      } else if (key === 'ArrowUp') {
        event.preventDefault();
        engine.moveSelection(0, -1);
      } else if (key === 'ArrowDown') {
        event.preventDefault();
        engine.moveSelection(0, 1);
      } else if (key === ' ' || key === 'Enter') {
        event.preventDefault();
        rotateSelected();
      } else if (key === 'u' || key === 'U') {
        event.preventDefault();
        engine.undo();
      } else if (key === 'r' || key === 'R') {
        event.preventDefault();
        engine.resetRoom();
      } else if (key === 'Escape') {
        event.preventDefault();
        engine.backToAtlas();
      }
    };

    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [beginRun, engine, rotateSelected]);

  const elapsedMs = startedAt.current ? (now || Date.now()) - startedAt.current : snap.elapsedMs;

  return (
    <div className="pw-root" data-variant={variant}>
      <div className="pw-shell">
        <header className="pw-header">
          <div className="pw-heading">
            <p className="pw-kicker">GAMEHUB</p>
            <h1>Puzzle World</h1>
            <p className="pw-sub">A new atlas of places and relics every run — tap tiles until the path snaps shut.</p>
          </div>
          <div className="pw-header-actions">
            <Link href="/games">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}>
                Back to Games
              </Button>
            </Link>
            {(snap.status === 'atlas' || snap.status === 'room' || snap.status === 'cleared') && (
              <Button variant="secondary" size="sm" onClick={() => engine.finishRun()}>
                End run
              </Button>
            )}
          </div>
        </header>

        {(snap.status === 'atlas' || snap.status === 'room' || snap.status === 'cleared') && (
          <PuzzleHUD
            score={snap.score}
            roomsSolved={snap.roomsSolved}
            roomCount={snap.atlas.length}
            moves={snap.moves}
            elapsedMs={elapsedMs}
          />
        )}

        {snap.status === 'atlas' && (
          <section className="pw-stage">
            <AtlasMap atlas={snap.atlas} rooms={snap.rooms} onSelect={(id) => engine.enterRoom(id)} />
            <p className="pw-copy pw-stage-copy">Choose an open room. This atlas is unique to this run.</p>
          </section>
        )}

        {(snap.status === 'room' || snap.status === 'cleared') && snap.currentRoom && (
          <section className="pw-stage">
            <div className="pw-room-head">
              <p className="pw-kicker">Room {snap.currentRoom.id}</p>
              <h2>{snap.currentRoom.name}</h2>
              <p className="pw-copy">{snap.currentRoom.hint}</p>
              {snap.currentRoom.gems > 0 && (
                <p className="pw-copy">
                  Collect {snap.currentRoom.gems}{' '}
                  {snap.currentRoom.gems > 1 ? RELIC_PLURAL[snap.currentRoom.relic] : snap.currentRoom.relic} on the
                  path.
                </p>
              )}
            </div>
            <PuzzleBoard
              tiles={snap.tiles}
              cols={snap.cols}
              rows={snap.rows}
              lit={snap.lit}
              selected={snap.selected}
              disabled={snap.status !== 'room'}
              mood={snap.currentRoom.mood}
              relic={snap.currentRoom.relic}
              onRotate={(x, y) => engine.rotate(x, y)}
            />
            <div className="pw-room-actions">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Undo2 className="w-4 h-4" aria-hidden="true" />}
                onClick={() => engine.undo()}
                disabled={!snap.canUndo || snap.status !== 'room'}
              >
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}
                onClick={() => engine.resetRoom()}
                disabled={snap.status !== 'room'}
              >
                Reset room
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Map className="w-4 h-4" aria-hidden="true" />}
                onClick={() => engine.backToAtlas()}
              >
                Atlas
              </Button>
            </div>
            {snap.status === 'cleared' && (
              <div className="pw-clear-banner">
                <p>Room snapped shut.</p>
                <Button size="sm" onClick={() => engine.backToAtlas()}>
                  Continue
                </Button>
              </div>
            )}
          </section>
        )}

        <p className="pw-desktop-hint">Tap to rotate · Arrows select · Space turn · U undo · Esc atlas</p>
      </div>

      {snap.status === 'ready' && (
        <ReadyScreen highScore={snap.highScore} onStart={() => void beginRun()} error={startError} starting={starting} />
      )}
      {snap.status === 'over' && (
        <ResultOverlay
          score={snap.score}
          roomsSolved={snap.roomsSolved}
          roomCount={snap.atlas.length}
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
