'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useGameSession } from '@/games/sdk';
import { shooterAudio } from './audio';
import { CountdownOverlay } from './components/CountdownOverlay';
import { Crosshair } from './components/Crosshair';
import { GameHUD } from './components/GameHUD';
import { GameOver } from './components/GameOver';
import { HowToPlay } from './components/HowToPlay';
import { LevelComplete } from './components/LevelComplete';
import { LoadingScreen } from './components/LoadingScreen';
import { MobileControls } from './components/MobileControls';
import { PauseMenu } from './components/PauseMenu';
import { SceneCanvas, type SceneHandle } from './components/SceneCanvas';
import { ScorePopups } from './components/ScorePopups';
import { SettingsPanel } from './components/SettingsPanel';
import { StartScreen } from './components/StartScreen';
import { WebGLFallback } from './components/WebGLFallback';
import { getLevel, TOTAL_LEVELS } from './levels';
import { bottleShooterStorage } from './storage';
import type { AudioSettings, GraphicsQuality, GameOverReason, GameScreen, HudSnapshot, RunStats, ScorePopup, WorldEvent, WorldEventExtra } from './types';

interface BottleShooterAppProps {
  variant?: 'hub' | 'play';
}

const EMPTY_HUD: HudSnapshot = {
  level: 1,
  levelName: 'Warmup Range',
  timeLeft: 60,
  score: 0,
  combo: 0,
  accuracy: 100,
  magazine: 12,
  reserve: 8,
  targeted: false,
  firing: false,
  reloading: false,
  reloadHint: false,
  bottlesLeft: 0,
  bottlesTotal: 0,
  shots: 0,
  hits: 0,
  hitPulse: false,
  perfectPulse: false,
};

let popupCounter = 0;

export function BottleShooterApp({ variant = 'hub' }: BottleShooterAppProps) {
  return (
    <AuthGuard>
      <BottleShooterInner variant={variant} />
    </AuthGuard>
  );
}

function BottleShooterInner({ variant = 'hub' }: BottleShooterAppProps) {
  const sceneRef = useRef<SceneHandle>(null);
  const screenRef = useRef<GameScreen>('loading');
  const pointerLocked = useRef(false);
  const touchAim = useRef<{ id: number; x: number; y: number } | null>(null);
  const startedAt = useRef(0);
  const scoreBeforeLevel = useRef(0);
  const runBroken = useRef(0);
  const runShots = useRef(0);
  const runBestCombo = useRef(0);
  const levelId = useRef(1);
  const settingsReturn = useRef<GameScreen>('menu');

  const { start, complete, abort, error: saveError, saving } = useGameSession('bottle-shooter-3d');
  const [screen, setScreen] = useState<GameScreen>('loading');
  const [hud, setHud] = useState<HudSnapshot>(EMPTY_HUD);
  const [highScore, setHighScore] = useState(0);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [count, setCount] = useState<number | 'GO'>(3);
  const [overReason, setOverReason] = useState<GameOverReason>('time');
  const [webglFailed, setWebglFailed] = useState(false);
  const [popups, setPopups] = useState<ScorePopup[]>([]);
  const [runStats, setRunStats] = useState<RunStats>({
    score: 0,
    accuracy: 100,
    shots: 0,
    bottlesBroken: 0,
    bestCombo: 0,
    level: 1,
    reason: 'time',
  });
  const [audio, setAudio] = useState<AudioSettings>(() => shooterAudio.getSettings());
  const [quality, setQuality] = useState<GraphicsQuality>('high');
  const [loadProgress, setLoadProgress] = useState(0.06);
  const [loadMessage, setLoadMessage] = useState('LOADING RANGE...');
  const [isTouch, setIsTouch] = useState(false);

  screenRef.current = screen;

  useEffect(() => {
    setHighScore(bottleShooterStorage.getHighScore());
    setQuality(bottleShooterStorage.getQuality());
    setIsTouch(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  // Clean up old popups
  useEffect(() => {
    if (popups.length === 0) return;
    const timer = window.setTimeout(() => {
      setPopups((prev) => prev.slice(-3));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [popups]);

  const addPopup = useCallback((text: string, kind: ScorePopup['kind']) => {
    popupCounter += 1;
    setPopups((prev) => [...prev.slice(-4), { id: popupCounter, text, kind }]);
  }, []);

  const setScreenSafe = useCallback((next: GameScreen) => {
    screenRef.current = next;
    setScreen(next);
    sceneRef.current?.setPaused(next === 'paused' || next === 'settings');
    if (next !== 'playing' && pointerLocked.current && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, []);

  const requestPointerLockIfNeeded = useCallback(() => {
    if (isTouch) return;
    const canvas = document.querySelector('.bs-canvas') as HTMLCanvasElement | null;
    if (canvas && !document.pointerLockElement) {
      void canvas.requestPointerLock?.();
    }
  }, [isTouch]);

  const captureStats = useCallback((reason: GameOverReason): RunStats => {
    const live = sceneRef.current?.getStats();
    return {
      score: live?.score ?? hud.score,
      accuracy: live?.accuracy ?? hud.accuracy,
      shots: runShots.current + (live?.shots ?? 0),
      bottlesBroken: runBroken.current + (live?.bottlesBroken ?? 0),
      bestCombo: Math.max(runBestCombo.current, live?.bestCombo ?? 0),
      level: levelId.current,
      reason,
    };
  }, [hud.accuracy, hud.score]);

  const persistRun = useCallback(
    (stats: RunStats) => {
      setHighScore(bottleShooterStorage.setHighScore(stats.score));
      void complete({
        score: stats.score,
        lines: stats.bottlesBroken,
        level: stats.level,
        moves: stats.shots,
        durationMs: startedAt.current ? Date.now() - startedAt.current : 0,
        result: 'completed',
        reason: stats.reason,
      }).catch(() => undefined);
    },
    [complete]
  );

  const unlockAudio = useCallback(() => {
    shooterAudio.unlock();
  }, []);

  const handleHud = useCallback((next: HudSnapshot) => {
    setHud(next);
  }, []);

  const handleEvent = useCallback(
    (event: WorldEvent, extra?: WorldEventExtra) => {
      const soundMap: Partial<Record<WorldEvent, Parameters<typeof shooterAudio.play>[0]>> = {
        shot: 'shot',
        miss: undefined,
        empty: 'empty',
        'hit-glass': 'glass-hit',
        crack: 'glass-crack',
        shatter: 'shatter',
        'hit-wood': 'wood',
        'hit-metal': 'metal',
        combo: 'combo',
        bonus: 'bonus',
        gold: 'gold',
        perfect: 'perfect',
        'reload-start': 'reload',
        'reload-end': 'handling',
        'magazine-click': 'magazine-click',
        'level-complete': 'level-complete',
        'out-of-ammo': 'level-failed',
        'time-up': 'level-failed',
      };
      const cue = soundMap[event];
      if (cue) shooterAudio.play(cue, extra);

      // Score popups
      if (event === 'shatter' && extra?.points) {
        const points = extra.points;
        if (extra.kind === 'gold') {
          addPopup(`GOLD! +${points}`, 'gold');
        } else if (extra.kind === 'bonus') {
          addPopup(`BONUS +${points}`, 'bonus');
        } else if (extra.center) {
          addPopup(`PERFECT +${points}`, 'perfect');
        } else {
          addPopup(`+${points}`, 'normal');
        }
      }
      if (event === 'combo' && extra?.combo && extra.combo >= 2) {
        addPopup(`COMBO ×${Math.min(extra.combo, 5)}`, 'combo');
      }

      if (event === 'level-complete' && screenRef.current === 'playing') {
        const live = sceneRef.current?.getStats();
        runBestCombo.current = Math.max(runBestCombo.current, live?.bestCombo ?? 0);
        const stats = {
          score: live?.score ?? 0,
          accuracy: live?.accuracy ?? 100,
          shots: live?.shots ?? 0,
          bottlesBroken: live?.bottlesBroken ?? 0,
          bestCombo: Math.max(runBestCombo.current, live?.bestCombo ?? 0),
          level: levelId.current,
          reason: 'time' as const,
        };
        setRunStats(stats);
        if (levelId.current >= TOTAL_LEVELS) persistRun(captureStats('time'));
        setScreenSafe('level-complete');
      }

      if ((event === 'out-of-ammo' || event === 'time-up') && screenRef.current === 'playing') {
        const reason: GameOverReason = event === 'out-of-ammo' ? 'ammo' : 'time';
        const stats = captureStats(reason);
        setOverReason(reason);
        setRunStats(stats);
        persistRun(stats);
        setScreenSafe('game-over');
      }
    },
    [addPopup, captureStats, persistRun, setScreenSafe]
  );

  const onSceneReady = useCallback(() => {
    if (screenRef.current === 'loading') {
      setScreenSafe('menu');
    }
  }, [setScreenSafe]);

  const onSceneError = useCallback(() => {
    setWebglFailed(true);
  }, []);

  const beginCountdown = useCallback(
    (id: number, carry = 0) => {
      levelId.current = id;
      scoreBeforeLevel.current = carry;
      setCount(3);
      setScreenSafe('countdown');
      shooterAudio.play('countdown');
      const ticks: Array<number | 'GO'> = [2, 1, 'GO'];
      ticks.forEach((value, index) => {
        window.setTimeout(() => {
          if (screenRef.current !== 'countdown') return;
          setCount(value);
          shooterAudio.play(value === 'GO' ? 'go' : 'countdown');
          if (value === 'GO') {
            window.setTimeout(() => {
              if (screenRef.current !== 'countdown') return;
              sceneRef.current?.loadLevel(getLevel(id), carry);
              setScreenSafe('playing');
              requestPointerLockIfNeeded();
            }, 420);
          }
        }, (index + 1) * 700);
      });
    },
    [requestPointerLockIfNeeded, setScreenSafe]
  );

  const beginRun = useCallback(
    async (fromLevel = 1) => {
      if (starting) return;
      unlockAudio();
      setStarting(true);
      setStartError(null);
      setPopups([]);
      try {
        await start();
        startedAt.current = Date.now();
        runBroken.current = 0;
        runShots.current = 0;
        runBestCombo.current = 0;
        scoreBeforeLevel.current = 0;
        beginCountdown(fromLevel, 0);
      } catch (err) {
        setStartError(err instanceof Error ? err.message : 'Could not start game session');
        setScreenSafe('menu');
      } finally {
        setStarting(false);
      }
    },
    [beginCountdown, setScreenSafe, start, starting, unlockAudio]
  );

  const exitToMenu = useCallback(() => {
    void abort();
    sceneRef.current?.setMode('menu');
    setScreenSafe('menu');
  }, [abort, setScreenSafe]);

  // Keyboard handler
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const current = screenRef.current;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (current === 'playing') setScreenSafe('paused');
        else if (current === 'paused') {
          setScreenSafe('playing');
          requestPointerLockIfNeeded();
        }
        else if (current === 'settings') setScreenSafe(settingsReturn.current);
        else if (current === 'how-to') setScreenSafe('menu');
        return;
      }
      if (current === 'menu' && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        void beginRun();
        return;
      }
      if (current !== 'playing') return;
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        sceneRef.current?.reload();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [beginRun, requestPointerLockIfNeeded, setScreenSafe]);

  // Pointer lock change
  useEffect(() => {
    const onLock = () => {
      const locked = Boolean(document.pointerLockElement);
      const wasLocked = pointerLocked.current;
      pointerLocked.current = locked;
      if (wasLocked && !locked && screenRef.current === 'playing' && !isTouch) {
        setScreenSafe('paused');
      }
    };
    document.addEventListener('pointerlockchange', onLock);
    return () => document.removeEventListener('pointerlockchange', onLock);
  }, [isTouch, setScreenSafe]);

  // Cleanup
  useEffect(
    () => () => {
      shooterAudio.stop();
      void abort();
    },
    [abort]
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (screen !== 'playing') return;
    if ((event.target as HTMLElement).closest('button, a')) return;
    unlockAudio();
    if (event.pointerType === 'touch') {
      touchAim.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      return;
    }
    if (event.button === 0) {
      const canvas = event.currentTarget.querySelector('canvas');
      if (canvas && !document.pointerLockElement) {
        void canvas.requestPointerLock?.();
      }
      sceneRef.current?.shoot();
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (screen !== 'playing') return;
    if (event.pointerType === 'touch' && touchAim.current?.id === event.pointerId) {
      const dx = event.clientX - touchAim.current.x;
      const dy = event.clientY - touchAim.current.y;
      touchAim.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      sceneRef.current?.lookDelta(dx * 1.15, dy * 1.15);
      return;
    }
    if (document.pointerLockElement) {
      sceneRef.current?.lookDelta(event.movementX, event.movementY);
      return;
    }
    if (event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    sceneRef.current?.lookAbsolute(nx, -ny);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (touchAim.current?.id === event.pointerId) touchAim.current = null;
  };

  const lastLevel = levelId.current >= TOTAL_LEVELS;

  if (webglFailed) {
    return (
      <div className="bs-root">
        <WebGLFallback />
      </div>
    );
  }

  return (
    <div className="bs-root" data-variant={variant} data-screen={screen}>
      <div
        className="bs-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <SceneCanvas
          ref={sceneRef}
          onHud={handleHud}
          onEvent={handleEvent}
          onReady={onSceneReady}
          onError={onSceneError}
          onProgress={(value, message) => {
            setLoadProgress(value);
            setLoadMessage(message);
          }}
        />
        {(screen === 'playing' || screen === 'countdown') && (
          <Crosshair targeted={hud.targeted} firing={hud.firing} hit={hud.hitPulse} perfect={hud.perfectPulse} />
        )}
      </div>

      {screen === 'loading' && <LoadingScreen progress={loadProgress} message={loadMessage} />}

      {screen === 'playing' && (
        <>
          <GameHUD
            hud={hud}
            onPause={() => {
              shooterAudio.play('click');
              setScreenSafe('paused');
            }}
          />
          <ScorePopups items={popups} />
          {isTouch && (
            <MobileControls
              onFire={() => sceneRef.current?.shoot()}
              onReload={() => sceneRef.current?.reload()}
              reloading={hud.reloading}
              canFire={hud.magazine > 0}
              onPause={() => {
                shooterAudio.play('click');
                setScreenSafe('paused');
              }}
            />
          )}
        </>
      )}

      {screen === 'menu' && (
        <StartScreen
          highScore={highScore}
          starting={starting}
          error={startError}
          onPlay={() => {
            shooterAudio.play('click');
            void beginRun(1);
          }}
          onHowTo={() => {
            shooterAudio.play('click');
            setScreenSafe('how-to');
          }}
          onSettings={() => {
            shooterAudio.play('click');
            settingsReturn.current = 'menu';
            setScreenSafe('settings');
          }}
        />
      )}
      {screen === 'how-to' && (
        <HowToPlay
          onBack={() => {
            shooterAudio.play('click');
            setScreenSafe('menu');
          }}
        />
      )}
      {screen === 'settings' && (
        <SettingsPanel
          audio={audio}
          quality={quality}
          onMuted={(muted) => {
            shooterAudio.setMuted(muted);
            setAudio(shooterAudio.getSettings());
          }}
          onSound={(volume) => {
            shooterAudio.setSoundVolume(volume);
            setAudio(shooterAudio.getSettings());
          }}
          onMusic={(volume) => {
            shooterAudio.setMusicVolume(volume);
            setAudio(shooterAudio.getSettings());
          }}
          onQuality={(next) => {
            bottleShooterStorage.setQuality(next);
            setQuality(next);
            sceneRef.current?.setQuality(next);
          }}
          onBack={() => {
            shooterAudio.play('click');
            setScreenSafe(settingsReturn.current);
          }}
        />
      )}
      {screen === 'countdown' && <CountdownOverlay value={count} />}
      {screen === 'paused' && (
        <PauseMenu
          onResume={() => {
            shooterAudio.play('click');
            setScreenSafe('playing');
            requestPointerLockIfNeeded();
          }}
          onRestart={() => {
            shooterAudio.play('click');
            beginCountdown(levelId.current, scoreBeforeLevel.current);
          }}
          onSettings={() => {
            shooterAudio.play('click');
            settingsReturn.current = 'paused';
            setScreenSafe('settings');
          }}
          onExit={() => {
            shooterAudio.play('click');
            exitToMenu();
          }}
        />
      )}
      {screen === 'level-complete' && (
        <LevelComplete
          level={levelId.current}
          lastLevel={lastLevel}
          stats={runStats}
          onNext={() => {
            shooterAudio.play('click');
            const live = sceneRef.current?.getStats();
            runBroken.current += live?.bottlesBroken ?? runStats.bottlesBroken;
            runShots.current += live?.shots ?? runStats.shots;
            runBestCombo.current = Math.max(runBestCombo.current, live?.bestCombo ?? runStats.bestCombo);
            beginCountdown(levelId.current + 1, live?.score ?? runStats.score);
          }}
          onReplay={() => {
            shooterAudio.play('click');
            beginCountdown(levelId.current, scoreBeforeLevel.current);
          }}
        />
      )}
      {screen === 'game-over' && (
        <GameOver
          reason={overReason}
          stats={runStats}
          onRetry={() => {
            shooterAudio.play('click');
            void beginRun(1);
          }}
        />
      )}

      {screen !== 'menu' && screen !== 'playing' && screen !== 'countdown' && screen !== 'loading' && (
        <Link href="/games" className="bs-back bs-back-float" onClick={() => void abort()}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Games
        </Link>
      )}

      <button
        type="button"
        className={`bs-mute${audio.muted ? ' is-off' : ''}`}
        onClick={() => {
          unlockAudio();
          shooterAudio.setMuted(!audio.muted);
          setAudio(shooterAudio.getSettings());
        }}
        aria-label={audio.muted ? 'Unmute' : 'Mute'}
      >
        {audio.muted ? '🔇' : '🔊'}
      </button>

      {saving && <p className="bs-save">Saving…</p>}
      {saveError && screen === 'game-over' && <p className="bs-save is-error">{saveError}</p>}
    </div>
  );
}
