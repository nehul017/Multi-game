import type { CoilModeInfo } from './types';

export const COIL_MODES: CoilModeInfo[] = [
  { id: 'classic', name: 'Classic', blurb: 'Free play. Collect food, grow, and survive with no time limit.' },
  { id: 'time-rush', name: 'Time Rush', blurb: 'Two minutes. Highest score wins the round.' },
  { id: 'battle', name: 'Battle', blurb: 'Hunt rivals. Eliminations are worth the most.' },
  { id: 'survival', name: 'Survival', blurb: 'One life. Last coil standing takes the arena.' },
  { id: 'teams', name: 'Ember vs Tide', blurb: 'Team battle. Friendly coils cannot hurt each other.' },
  { id: 'boss', name: 'Titan Coil', blurb: 'A giant AI hunter patrols the ring.' },
  { id: 'friends', name: 'Private Coil', blurb: 'Invite friends. No bots, no timer, join mid-run.' },
];

export const COIL_FEATURED_SKINS = ['fire', 'ocean', 'neon', 'galaxy', 'toxic', 'candy', 'gold'] as const;

export const COIL_STORAGE = {
  skin: 'coil-rush-skin',
  best: 'coil-rush-best',
  muted: 'coil-rush-muted',
  music: 'coil-rush-music',
  stats: 'coil-rush-stats',
} as const;
