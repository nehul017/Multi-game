'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { GraphicsQuality, HudSnapshot, LevelConfig, WorldEvent, WorldEventExtra, WorldHooks } from '../types';
import type { BottleShooterWorld } from '../engine/world';
import { bottleShooterStorage } from '../storage';

export interface SceneHandle {
  loadLevel: (config: LevelConfig, carryScore?: number) => void;
  shoot: () => boolean;
  reload: () => boolean;
  setPaused: (paused: boolean) => void;
  setMode: (mode: 'menu' | 'play') => void;
  setQuality: (quality: GraphicsQuality) => void;
  lookDelta: (dx: number, dy: number) => void;
  lookAbsolute: (nx: number, ny: number) => void;
  getStats: () => {
    score: number;
    accuracy: number;
    shots: number;
    bottlesBroken: number;
    bestCombo: number;
    hits: number;
  };
}

interface SceneCanvasProps {
  onHud: (hud: HudSnapshot) => void;
  onEvent: (event: WorldEvent, extra?: WorldEventExtra) => void;
  onReady: () => void;
  onError: () => void;
  onProgress?: (value: number, message: string) => void;
}

export const SceneCanvas = forwardRef<SceneHandle, SceneCanvasProps>(function SceneCanvas(
  { onHud, onEvent, onReady, onError, onProgress },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<BottleShooterWorld | null>(null);
  const hooksRef = useRef<WorldHooks>({ onHud, onEvent });
  const progressRef = useRef(onProgress);
  hooksRef.current = { onHud, onEvent };
  progressRef.current = onProgress;

  useImperativeHandle(ref, () => ({
    loadLevel: (config, carryScore) => worldRef.current?.loadLevel(config, carryScore),
    shoot: () => worldRef.current?.shoot() ?? false,
    reload: () => worldRef.current?.reload() ?? false,
    setPaused: (paused) => worldRef.current?.setPaused(paused),
    setMode: (mode) => worldRef.current?.setMode(mode),
    setQuality: (quality) => worldRef.current?.setQuality(quality),
    lookDelta: (dx, dy) => worldRef.current?.lookDelta(dx, dy),
    lookAbsolute: (nx, ny) => worldRef.current?.lookAbsolute(nx, ny),
    getStats: () =>
      worldRef.current?.getStats() ?? {
        score: 0,
        accuracy: 100,
        shots: 0,
        bottlesBroken: 0,
        bestCombo: 0,
        hits: 0,
      },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    try {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        onError();
        return undefined;
      }
    } catch {
      onError();
      return undefined;
    }

    let cancelled = false;
    let world: BottleShooterWorld | null = null;

    void import('../engine/world')
      .then(async ({ BottleShooterWorld }) => {
        if (cancelled || !canvas.isConnected) return;
        world = new BottleShooterWorld(
          canvas,
          {
            onHud: (hud) => hooksRef.current.onHud(hud),
            onEvent: (event, extra) => hooksRef.current.onEvent(event, extra),
          },
          bottleShooterStorage.getQuality()
        );
        await world.bootstrap((value, message) => progressRef.current?.(value, message));
        if (cancelled) {
          world.dispose();
          return;
        }
        world.setMode('menu');
        world.start();
        worldRef.current = world;
        onReady();
      })
      .catch(() => {
        if (!cancelled) onError();
      });

    return () => {
      cancelled = true;
      world?.dispose();
      worldRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <canvas ref={canvasRef} className="bs-canvas" aria-label="Bottle Shooter 3D range" />;
});
