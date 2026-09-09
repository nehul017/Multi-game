'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

type SoundName =
  | 'shuffle'
  | 'deal'
  | 'click'
  | 'pickup'
  | 'slide'
  | 'play'
  | 'trick'
  | 'ten'
  | 'turn'
  | 'round'
  | 'win'
  | 'loss';

const SOUND_URLS: Record<SoundName, string[]> = {
  shuffle: ['/sounds/mindi/shuffle.mp3', '/sounds/ttt/countdown.mp3'],
  deal: ['/sounds/mindi/deal.mp3', '/sounds/ttt/countdown.mp3'],
  click: ['/sounds/mindi/click.mp3', '/sounds/ttt/hover.mp3'],
  pickup: ['/sounds/mindi/pickup.mp3', '/sounds/ttt/hover.mp3'],
  slide: ['/sounds/mindi/slide.mp3', '/sounds/ttt/move.mp3'],
  play: ['/sounds/mindi/play.mp3', '/sounds/ttt/move.mp3'],
  trick: ['/sounds/mindi/trick.mp3', '/sounds/ttt/move.mp3'],
  ten: ['/sounds/mindi/ten.mp3', '/sounds/ttt/win.mp3'],
  turn: ['/sounds/mindi/turn.mp3', '/sounds/ttt/hover.mp3'],
  round: ['/sounds/mindi/round.mp3', '/sounds/ttt/win.mp3'],
  win: ['/sounds/mindi/win.mp3', '/sounds/ttt/win.mp3'],
  loss: ['/sounds/mindi/loss.mp3', '/sounds/ttt/draw.mp3'],
};

export function useMindiSounds() {
  const [muted, setMuted] = useState(false);
  const cacheRef = useRef<Partial<Record<SoundName, HTMLAudioElement | null>>>({});
  const disabledRef = useRef<Partial<Record<SoundName, boolean>>>({});
  const unlockedRef = useRef(false);

  const unlock = useCallback(() => {
    unlockedRef.current = true;
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (muted || typeof window === 'undefined' || !unlockedRef.current) return;
      if (disabledRef.current[name]) return;

      let audio = cacheRef.current[name];
      if (audio === undefined) {
        const urls = SOUND_URLS[name];
        audio = new Audio(urls[0]);
        audio.preload = 'auto';
        audio.volume = name === 'turn' || name === 'click' || name === 'pickup' ? 0.22 : 0.32;
        audio.addEventListener(
          'error',
          () => {
            if (urls[1]) {
              const fallback = new Audio(urls[1]);
              fallback.volume = audio?.volume ?? 0.32;
              cacheRef.current[name] = fallback;
            } else {
              disabledRef.current[name] = true;
            }
          },
          { once: true }
        );
        cacheRef.current[name] = audio;
      }
      if (!audio) return;
      try {
        audio.currentTime = 0;
        const pending = audio.play();
        if (pending && typeof pending.catch === 'function') pending.catch(() => undefined);
      } catch {
        /* autoplay / missing asset */
      }
    },
    [muted]
  );

  return useMemo(
    () => ({
      muted,
      setMuted,
      unlock,
      playShuffle: () => play('shuffle'),
      playDeal: () => play('deal'),
      playClick: () => play('click'),
      playPickup: () => play('pickup'),
      playSlide: () => play('slide'),
      playCard: () => play('play'),
      playTrick: () => play('trick'),
      playTen: () => play('ten'),
      playTurn: () => play('turn'),
      playRound: () => play('round'),
      playWin: () => play('win'),
      playLoss: () => play('loss'),
    }),
    [muted, play, unlock]
  );
}
