'use client';

import { useCallback, useMemo, useRef } from 'react';

type SoundName = 'move' | 'hover' | 'win' | 'draw' | 'countdown';

interface UseTttSoundsOptions {
  enabled?: boolean;
  volume?: number;
}

const SOUND_URLS: Record<SoundName, string> = {
  move: '/sounds/ttt/move.mp3',
  hover: '/sounds/ttt/hover.mp3',
  win: '/sounds/ttt/win.mp3',
  draw: '/sounds/ttt/draw.mp3',
  countdown: '/sounds/ttt/countdown.mp3',
};

/**
 * Lightweight sound hook for the Tic-Tac-Toe experience.
 *
 * Silently no-ops if the asset is missing — safe to call at any time.
 * Drop mp3 files at `/public/sounds/ttt/*.mp3` to enable audio without
 * touching call-sites.
 */
export function useTttSounds({ enabled = true, volume = 0.35 }: UseTttSoundsOptions = {}) {
  const cacheRef = useRef<Partial<Record<SoundName, HTMLAudioElement | null>>>({});
  const disabledRef = useRef<Partial<Record<SoundName, boolean>>>({});

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled || typeof window === 'undefined') return;
      if (disabledRef.current[name]) return;

      let audio = cacheRef.current[name];
      if (audio === undefined) {
        try {
          audio = new Audio(SOUND_URLS[name]);
          audio.preload = 'auto';
          audio.volume = volume;
          audio.addEventListener(
            'error',
            () => {
              disabledRef.current[name] = true;
            },
            { once: true },
          );
          cacheRef.current[name] = audio;
        } catch {
          disabledRef.current[name] = true;
          return;
        }
      }
      if (!audio) return;

      try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {
        // Ignore playback errors (autoplay policies, missing asset, etc.)
      }
    },
    [enabled, volume],
  );

  return useMemo(
    () => ({
      playMove: () => play('move'),
      playHover: () => play('hover'),
      playWin: () => play('win'),
      playDraw: () => play('draw'),
      playCountdown: () => play('countdown'),
    }),
    [play],
  );
}
