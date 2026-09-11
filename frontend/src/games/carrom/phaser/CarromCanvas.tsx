'use client';

import { useEffect, useRef } from 'react';
import type { CarromBoardState, CarromColor, CarromShotInput } from '../types';
import { CARROM_VIEW, CarromScene } from './CarromScene';

interface CarromCanvasProps {
  board: CarromBoardState | null;
  myColor: CarromColor;
  inputEnabled: boolean;
  localShotId?: string;
  onAim: (power: number, angle: number, active: boolean) => void;
  onShoot: (input: CarromShotInput) => void;
}

export default function CarromCanvas({
  board,
  myColor,
  inputEnabled,
  localShotId,
  onAim,
  onShoot,
}: CarromCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CarromScene | null>(null);
  const latestRef = useRef({ board, myColor, inputEnabled, localShotId, onAim, onShoot });
  latestRef.current = { board, myColor, inputEnabled, localShotId, onAim, onShoot };

  const pushState = (): void => {
    const scene = sceneRef.current;
    const latest = latestRef.current;
    if (!scene) return;
    scene.setCallbacks({
      onAim: (power, angle, active) => latestRef.current.onAim(power, angle, active),
      onShoot: (input) => latestRef.current.onShoot(input),
    });
    scene.setControl({ myColor: latest.myColor, inputEnabled: latest.inputEnabled });
    if (latest.board) scene.applyBoard(latest.board, latest.localShotId);
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let game: Phaser.Game | null = null;
    let cancelled = false;

    const start = async () => {
      const PhaserMod = await import('phaser');
      const Phaser = (PhaserMod as { default?: typeof PhaserMod }).default ?? PhaserMod;
      if (cancelled || !host) return;
      const scene = new CarromScene();
      sceneRef.current = scene;
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host,
        width: CARROM_VIEW,
        height: CARROM_VIEW,
        backgroundColor: '#00000000',
        transparent: true,
        audio: { noAudio: true },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        fps: { target: 60 },
        scene,
      });
      game.events.once('ready', pushState);
    };

    void start();
    return () => {
      cancelled = true;
      sceneRef.current = null;
      game?.destroy(true);
    };
  }, []);

  useEffect(() => {
    pushState();
  }, [board, myColor, inputEnabled, localShotId]);

  return <div ref={hostRef} className="carrom-phaser" />;
}
