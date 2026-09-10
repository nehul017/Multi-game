export type CoilView =
  | 'menu'
  | 'modes'
  | 'skins'
  | 'leaderboard'
  | 'missions'
  | 'profile'
  | 'settings'
  | 'rooms'
  | 'howto';

export type CoilMode = 'classic' | 'time-rush' | 'battle' | 'survival' | 'teams' | 'boss' | 'friends';
export type CoilPhase = 'waiting' | 'countdown' | 'playing' | 'round_end' | 'results';

export type CoilRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type CoilSkinCategory =
  | 'classic'
  | 'animals'
  | 'robots'
  | 'fantasy'
  | 'space'
  | 'funny'
  | 'legendary';

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

export type CoilFxKind = 'food' | 'kill' | 'death' | 'power' | 'boost';

export interface CoilSteerInput {
  angle: number;
  boost: boolean;
}

export interface CoilPoint {
  x: number;
  y: number;
}

export interface CoilFood {
  id?: string;
  x: number;
  y: number;
  value?: number;
  color?: string;
  r?: number;
  kind?: FoodKind;
}

export interface CoilSnake {
  playerId: string;
  name?: string;
  body: CoilPoint[];
  length?: number;
  angle?: number;
  targetAngle?: number;
  boosting?: boolean;
  alive: boolean;
  score: number;
  mass?: number;
  kills?: number;
  color: string;
  radius?: number;
  energy?: number;
  isBot?: boolean;
  isBoss?: boolean;
  team?: 'ember' | 'tide';
  skinId?: string;
  foodEaten?: number;
  combo?: number;
  effects?: {
    speedUntil?: number;
    shieldUntil?: number;
    magnetUntil?: number;
    ghostUntil?: number;
    multiplierUntil?: number;
  };
  respawnAt?: number | null;
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

export interface CoilBoard {
  mode?: CoilMode;
  phase?: CoilPhase;
  worldSize?: number;
  arenaRadius?: number;
  origin?: CoilPoint;
  snakes?: CoilSnake[];
  food?: CoilFood[];
  tickRate?: number;
  elapsedMs?: number;
  timeLimitMs?: number | null;
  countdownMs?: number;
  resultsMs?: number;
  roundIndex?: number;
  tickIndex?: number;
  online?: number;
  events?: CoilFxEvent[];
}

export interface CoilSkin {
  id: string;
  name: string;
  category: CoilSkinCategory;
  rarity: CoilRarity;
  color: string;
  accent: string;
  unlock: string;
  unlocked: boolean;
}

export interface CoilModeInfo {
  id: CoilMode;
  name: string;
  blurb: string;
}

export interface CoilRunStats {
  score: number;
  length: number;
  rank: number;
  timeMs: number;
  foodEaten: number;
  kills: number;
  bestScore: number;
  isRecord: boolean;
  coins?: number;
  xp?: number;
  eloChange?: number;
}
