export type CoilView =
  | 'menu'
  | 'modes'
  | 'skins'
  | 'leaderboard'
  | 'missions'
  | 'profile'
  | 'settings'
  | 'rooms';

export type CoilMode = 'classic' | 'time-rush' | 'survival' | 'teams' | 'boss' | 'friends';

export type CoilRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type CoilSkinCategory =
  | 'classic'
  | 'animals'
  | 'robots'
  | 'fantasy'
  | 'space'
  | 'funny'
  | 'legendary';

export type FoodKind = 'normal' | 'large' | 'speed' | 'shield' | 'magnet' | 'crystal';

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
  body: CoilPoint[];
  angle?: number;
  targetAngle?: number;
  boosting?: boolean;
  alive: boolean;
  score: number;
  kills?: number;
  color: string;
  radius?: number;
  energy?: number;
  isBot?: boolean;
  isBoss?: boolean;
  team?: 'ember' | 'tide';
  skinId?: string;
  foodEaten?: number;
  effects?: { speedUntil?: number; shieldUntil?: number; magnetUntil?: number };
  respawnAt?: number | null;
}

export interface CoilBoard {
  mode?: CoilMode;
  worldSize?: number;
  arenaRadius?: number;
  origin?: CoilPoint;
  snakes?: CoilSnake[];
  food?: CoilFood[];
  tickRate?: number;
  elapsedMs?: number;
  timeLimitMs?: number | null;
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
}
