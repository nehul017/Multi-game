export type CoilMode = 'classic' | 'time-rush' | 'survival' | 'teams' | 'boss' | 'friends';
export type BotStyle = 'random' | 'aggressive' | 'defensive' | 'hunter' | 'beginner' | 'advanced';
export type FoodKind = 'normal' | 'large' | 'speed' | 'shield' | 'magnet' | 'crystal';
export type CoilTeam = 'ember' | 'tide';

export interface SnakeMatchSettings {
  mode?: CoilMode;
  botCount?: number;
  skinByPlayer?: Record<string, string>;
}

export const COIL_SKIN_COLORS: Record<string, string> = {
  ember: '#ff6b35',
  tide: '#2ec4b6',
  aurora: '#7c5cff',
  citrus: '#ffd166',
  nova: '#00e5ff',
  moss: '#80ed99',
  ruby: '#ef476f',
  frost: '#90e0ef',
  fox: '#f97316',
  orca: '#1e293b',
  servo: '#94a3b8',
  pulse: '#22d3ee',
  myth: '#a78bfa',
  rune: '#34d399',
  comet: '#60a5fa',
  nebula: '#e879f9',
  noodle: '#fb7185',
  pickle: '#84cc16',
  crown: '#f59e0b',
};
