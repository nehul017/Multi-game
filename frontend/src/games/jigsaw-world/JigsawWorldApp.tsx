'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, Lightbulb, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useGameSession } from '@/games/sdk';
import { playJigsawCue } from './audio';
import { JigsawBoard } from './components/JigsawBoard';
import { JigsawHUD } from './components/JigsawHUD';
import { JigsawHub } from './components/JigsawHub';
import { JigsawResult } from './components/JigsawResult';
import { JigsawWorldEngine } from './logic';
import type { JigsawDifficultyId, JigsawSnapshot } from './types';

interface JigsawWorldAppProps {
  variant?: 'hub' | 'play';
}

export function JigsawWorldApp({ variant = 'hub' }: JigsawWorldAppProps) {
  return (
    <AuthGuard>
      <JigsawWorldInner variant={variant} />
    </AuthGuard>
  );
}

function JigsawWorldInner({ variant = 'hub' }: JigsawWorldAppProps) {
  const [engine] = useState(() => new JigsawWorldEngine());
  const { start, complete, abort, error: saveError, saving, lastResult } = useGameSession('jigsaw-world');
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [now, setNow] = useState(0);
  const [snap, setSnap] = useState<JigsawSnapshot>(() => engine.getSnapshot());
  const snapRef = useRef(snap);
  const startedAt = useRef(0);

  const sync = useCallback(() => {
    const next = engine.getSnapshot();
    snapRef.current = next;
    setSnap(next);
  }, [engine]);

  useEffect(() => engine.subscribe(sync), [engine, sync]);

  useEffect(() => {
    if (snap.status !== 'playing') return undefined;
    const tick = window.setInterval(() => {
      engine.tick();
      setNow(Date.now());
    }, 500);
    return () => window.clearInterval(tick);
  }, [engine, snap.status]);

  const prevSnap = useRef(snap);
  useEffect(() => {
    const prev = prevSnap.current;
    if (snap.snapTick !== prev.snapTick) playJigsawCue('snap');
    if (snap.status === 'complete' && prev.status !== 'complete') {
      playJigsawCue('complete');
      void complete({
        score: snap.score,
        lines: snap.total,
        level: snap.difficulty.level,
        moves: snap.moves,
        durationMs: startedAt.current ? Date.now() - startedAt.current : snap.elapsedMs,
        result: 'completed',
      }).catch(() => undefined);
    }
    prevSnap.current = snap;
  }, [complete, snap]);

  const beginPuzzle = useCallback(
    async (puzzleId: string, difficulty: JigsawDifficultyId) => {
      if (starting) return;
      setStarting(true);
      setStartError(null);
      try {
        await start({ puzzleId, difficulty });
        startedAt.current = Date.now();
        engine.start(puzzleId, difficulty);
      } catch (err) {
        setStartError(err instanceof Error ? err.message : 'Could not start game session');
      } finally {
        setStarting(false);
      }
    },
    [engine, start, starting]
  );

  const leaveBoard = useCallback(() => {
    void abort();
    engine.backToHub();
  }, [abort, engine]);

  const dropPiece = useCallback(
    (id: string) => {
      const result = engine.dropPiece(id);
      if (result === 'drop') playJigsawCue('drop');
    },
    [engine]
  );

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      const status = snapRef.current.status;
      if (status === 'playing' && event.key === 'Escape') {
        event.preventDefault();
        leaveBoard();
      }
      if (status === 'playing' && (event.key === 'h' || event.key === 'H')) {
        event.preventDefault();
        engine.hint();
      }
      if (status === 'playing' && (event.key === 'p' || event.key === 'P')) {
        event.preventDefault();
        engine.togglePreview();
      }
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [engine, leaveBoard]);

  const elapsedMs = snap.status === 'playing' && startedAt.current ? (now || Date.now()) - startedAt.current : snap.elapsedMs;

  return (
    <div className="jw-root" data-variant={variant}>
      {snap.status === 'hub' && (
        <JigsawHub highScore={snap.highScore} starting={starting} error={startError} onPlay={(id, difficulty) => void beginPuzzle(id, difficulty)} />
      )}

      {(snap.status === 'playing' || snap.status === 'complete') && snap.puzzle && (
        <div className="jw-shell">
          <header className="jw-header">
            <div className="jw-heading">
              <p className="jw-kicker">Jigsaw World</p>
              <h1>{snap.puzzle.title}</h1>
              <p className="jw-sub">{snap.puzzle.blurb}</p>
            </div>
            <div className="jw-header-actions">
              <Link href="/games">
                <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}>
                  Games
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={leaveBoard}>
                Gallery
              </Button>
            </div>
          </header>

          <JigsawHUD
            title={snap.puzzle.title}
            placed={snap.placed}
            total={snap.total}
            elapsedMs={elapsedMs}
            difficulty={snap.difficulty.label}
          />

          <JigsawBoard
            puzzle={snap.puzzle}
            pieces={snap.pieces}
            cols={snap.cols}
            rows={snap.rows}
            showPreview={snap.showPreview}
            hintSlot={snap.hintSlot}
            disabled={snap.status !== 'playing'}
            onLift={(id) => {
              playJigsawCue('pickup');
              engine.liftPiece(id);
            }}
            onMove={(id, x, y) => engine.movePiece(id, x, y)}
            onDrop={dropPiece}
          />

          <div className="jw-room-actions">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Eye className="w-4 h-4" aria-hidden="true" />}
              onClick={() => engine.togglePreview()}
            >
              {snap.showPreview ? 'Hide picture' : 'Show picture'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Lightbulb className="w-4 h-4" aria-hidden="true" />}
              onClick={() => engine.hint()}
              disabled={snap.status !== 'playing'}
            >
              Hint
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Shuffle className="w-4 h-4" aria-hidden="true" />}
              onClick={() => engine.shuffleLoose()}
              disabled={snap.status !== 'playing'}
            >
              Shuffle
            </Button>
          </div>
          <p className="jw-desktop-hint">Drag pieces onto the board · they snap when close · H hint · P preview · Esc gallery</p>
        </div>
      )}

      {snap.status === 'complete' && snap.puzzle && (
        <JigsawResult
          title={snap.puzzle.title}
          score={snap.score}
          highScore={snap.highScore}
          isNewHigh={snap.isNewHigh}
          placed={snap.placed}
          total={snap.total}
          elapsedMs={snap.elapsedMs}
          difficulty={snap.difficulty.label}
          onPlayAgain={() => void beginPuzzle(snap.puzzle!.id, snap.difficulty.id)}
          onGallery={leaveBoard}
          saving={saving}
          saveError={saveError}
          coins={lastResult?.rewards?.coins}
          xp={lastResult?.rewards?.xp}
        />
      )}
    </div>
  );
}
