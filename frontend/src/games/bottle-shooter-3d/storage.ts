import type { AudioSettings, GraphicsQuality } from './types';
import { detectDefaultQuality } from './engine/quality';

const PREFIX = 'bottle-shooter-3d';

const keys = {
  highScore: `${PREFIX}:high-score`,
  muted: `${PREFIX}:muted`,
  soundVolume: `${PREFIX}:sound-volume`,
  musicVolume: `${PREFIX}:music-volume`,
  quality: `${PREFIX}:quality`,
} as const;

const QUALITIES: GraphicsQuality[] = ['low', 'medium', 'high', 'ultra'];

const readNumber = (key: string, fallback: number): number => {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw == null) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

export const bottleShooterStorage = {
  getHighScore(): number {
    return Math.max(0, Math.floor(readNumber(keys.highScore, 0)));
  },

  setHighScore(score: number): number {
    const next = Math.max(this.getHighScore(), Math.floor(score));
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(keys.highScore, String(next));
    }
    return next;
  },

  getAudio(): AudioSettings {
    return {
      muted: typeof window !== 'undefined' && window.localStorage.getItem(keys.muted) === '1',
      soundVolume: Math.min(1, Math.max(0, readNumber(keys.soundVolume, 0.85))),
      musicVolume: Math.min(1, Math.max(0, readNumber(keys.musicVolume, 0.35))),
    };
  },

  setAudio(settings: AudioSettings): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(keys.muted, settings.muted ? '1' : '0');
    window.localStorage.setItem(keys.soundVolume, String(settings.soundVolume));
    window.localStorage.setItem(keys.musicVolume, String(settings.musicVolume));
  },

  getQuality(): GraphicsQuality {
    if (typeof window === 'undefined') return 'high';
    const raw = window.localStorage.getItem(keys.quality);
    if (raw && QUALITIES.includes(raw as GraphicsQuality)) return raw as GraphicsQuality;
    return detectDefaultQuality();
  },

  setQuality(quality: GraphicsQuality): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(keys.quality, quality);
  },
};
