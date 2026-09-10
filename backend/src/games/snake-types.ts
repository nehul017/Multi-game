export type CoilMode = 'classic' | 'time-rush' | 'battle' | 'survival' | 'teams' | 'boss' | 'friends';
export type CoilPhase = 'waiting' | 'countdown' | 'playing' | 'round_end' | 'results';
export type BotStyle = 'random' | 'aggressive' | 'defensive' | 'hunter' | 'beginner' | 'advanced';
export type FoodKind =
  | 'normal'
  | 'large'
  | 'apple'
  | 'orange'
  | 'berry'
  | 'banana'
  | 'burger'
  | 'pizza'
  | 'fries'
  | 'soda'
  | 'gem'
  | 'star'
  | 'orb'
  | 'speed'
  | 'shield'
  | 'magnet'
  | 'ghost'
  | 'multiplier'
  | 'crystal';
export type CoilTeam = 'ember' | 'tide';
export type CoilFxKind = 'food' | 'kill' | 'death' | 'power' | 'boost';

export interface SnakeMatchSettings {
  mode?: CoilMode;
  botCount?: number;
  skinByPlayer?: Record<string, string>;
  nameByPlayer?: Record<string, string>;
  skipCountdown?: boolean;
  roundMs?: number;
  maxPlayers?: number;
}

export interface CoilFxEvent {
  id: string;
  kind: CoilFxKind;
  x: number;
  y: number;
  playerId: string;
  value?: number;
  label?: string;
}

export const COIL_SKIN_COLORS: Record<string, string> = {
  fire: '#ff5a1f',
  ocean: '#2f9bff',
  neon: '#39ffb0',
  galaxy: '#8b5cf6',
  toxic: '#84cc16',
  candy: '#fb7185',
  gold: '#f5c518',
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

export const COIL_ENGINE_SLUG = 'snake-multiplayer';
export const COIL_ROUTE_SLUG = 'coil-rush';

export const isCoilRushGame = (gameType: string): boolean =>
  gameType === COIL_ENGINE_SLUG || gameType === COIL_ROUTE_SLUG;

export const canonicalCoilGameType = (gameType: string): string =>
  isCoilRushGame(gameType) ? COIL_ENGINE_SLUG : gameType;
