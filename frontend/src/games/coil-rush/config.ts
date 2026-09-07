import type { CoilModeInfo } from './types';

export const COIL_MODES: CoilModeInfo[] = [
  { id: 'classic', name: 'Classic Coil', blurb: 'Play until you die. Eat, grow, and cut rivals. No clock.' },
  { id: 'time-rush', name: 'Time Rush', blurb: 'Two minutes. Highest mass wins.' },
  { id: 'survival', name: 'Survival', blurb: 'One life. Last coil standing takes the arena.' },
  { id: 'teams', name: 'Ember vs Tide', blurb: 'Team battle. Friendly coils cannot hurt each other.' },
  { id: 'boss', name: 'Titan Coil', blurb: 'A giant AI hunter patrols the ring.' },
  { id: 'friends', name: 'Private Coil', blurb: 'Invite friends. No bots, join mid-run.' },
];

export const COIL_STORAGE = {
  skin: 'coil-rush-skin',
  best: 'coil-rush-best',
  muted: 'coil-rush-muted',
  music: 'coil-rush-music',
  stats: 'coil-rush-stats',
} as const;
