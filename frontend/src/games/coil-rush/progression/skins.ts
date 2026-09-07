import type { CoilSkin } from '../types';

export const COIL_SKINS: CoilSkin[] = [
  { id: 'ember', name: 'Ember Thread', category: 'classic', rarity: 'common', color: '#ff6b35', accent: '#ffd166', unlock: 'Starter coil', unlocked: true },
  { id: 'tide', name: 'Tide Line', category: 'classic', rarity: 'common', color: '#2ec4b6', accent: '#90e0ef', unlock: 'Starter coil', unlocked: true },
  { id: 'aurora', name: 'Aurora Rib', category: 'classic', rarity: 'rare', color: '#7c5cff', accent: '#c4b5fd', unlock: 'Reach level 3', unlocked: false },
  { id: 'citrus', name: 'Citrus Whip', category: 'classic', rarity: 'rare', color: '#ffd166', accent: '#fff3bf', unlock: 'Play 1 match', unlocked: false },
  { id: 'fox', name: 'Fox Tail', category: 'animals', rarity: 'rare', color: '#f97316', accent: '#fed7aa', unlock: 'Play 1 match', unlocked: false },
  { id: 'orca', name: 'Orca Band', category: 'animals', rarity: 'epic', color: '#1e293b', accent: '#e2e8f0', unlock: 'Best score 40', unlocked: false },
  { id: 'servo', name: 'Servo Link', category: 'robots', rarity: 'rare', color: '#94a3b8', accent: '#38bdf8', unlock: 'Play 5 matches', unlocked: false },
  { id: 'pulse', name: 'Pulse Rail', category: 'robots', rarity: 'epic', color: '#22d3ee', accent: '#082f49', unlock: 'Eliminate 5 coils', unlocked: false },
  { id: 'myth', name: 'Myth Scale', category: 'fantasy', rarity: 'epic', color: '#a78bfa', accent: '#fde68a', unlock: 'Best score 80', unlocked: false },
  { id: 'rune', name: 'Rune Serpent', category: 'fantasy', rarity: 'legendary', color: '#34d399', accent: '#fbbf24', unlock: 'Play 1 match', unlocked: false },
  { id: 'comet', name: 'Comet Drift', category: 'space', rarity: 'rare', color: '#60a5fa', accent: '#f8fafc', unlock: 'Play 1 match', unlocked: false },
  { id: 'nebula', name: 'Nebula Coil', category: 'space', rarity: 'legendary', color: '#e879f9', accent: '#38bdf8', unlock: 'Best score 200', unlocked: false },
  { id: 'noodle', name: 'Noodle Joke', category: 'funny', rarity: 'common', color: '#fb7185', accent: '#fde047', unlock: 'Play 1 match', unlocked: false },
  { id: 'pickle', name: 'Pickle Coil', category: 'funny', rarity: 'rare', color: '#84cc16', accent: '#facc15', unlock: 'Play 1 match', unlocked: false },
  { id: 'crown', name: 'Crown Current', category: 'legendary', rarity: 'legendary', color: '#f59e0b', accent: '#fff7ed', unlock: 'Reach level 10', unlocked: false },
];

export const skinById = (id: string): CoilSkin =>
  COIL_SKINS.find((skin) => skin.id === id) || COIL_SKINS[0];

export function isSkinUnlocked(
  skin: CoilSkin,
  ctx: { best: number; games: number; kills: number; level: number }
): boolean {
  if (skin.unlocked) return true;
  if (skin.id === 'aurora') return ctx.level >= 3;
  if (skin.id === 'citrus' || skin.id === 'fox') return ctx.games >= 1;
  if (skin.id === 'orca') return ctx.best >= 40;
  if (skin.id === 'servo') return ctx.games >= 5;
  if (skin.id === 'pulse') return ctx.kills >= 5;
  if (skin.id === 'myth') return ctx.best >= 80;
  if (skin.id === 'nebula') return ctx.best >= 200;
  if (skin.id === 'crown') return ctx.level >= 10;
  return ctx.games >= 1;
}
