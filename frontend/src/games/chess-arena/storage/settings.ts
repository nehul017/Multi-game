import { CHESS_STORAGE, DEFAULT_CHESS_SETTINGS } from '../config';
import type { ChessSettings } from '../types';

function read(): ChessSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_CHESS_SETTINGS };
  try {
    const raw = window.localStorage.getItem(CHESS_STORAGE.settings);
    if (!raw) return { ...DEFAULT_CHESS_SETTINGS };
    return { ...DEFAULT_CHESS_SETTINGS, ...(JSON.parse(raw) as Partial<ChessSettings>) };
  } catch {
    return { ...DEFAULT_CHESS_SETTINGS };
  }
}

export const chessSettings = {
  get: read,
  set(next: Partial<ChessSettings>) {
    const merged = { ...read(), ...next };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CHESS_STORAGE.settings, JSON.stringify(merged));
    }
    return merged;
  },
};
