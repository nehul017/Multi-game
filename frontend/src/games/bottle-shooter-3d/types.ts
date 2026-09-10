export type BottleKind = 'normal' | 'heavy' | 'moving' | 'spinning' | 'bonus' | 'gold';

export type GameScreen =
  | 'loading'
  | 'menu'
  | 'how-to'
  | 'settings'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'level-complete'
  | 'game-over';

export type GameOverReason = 'time' | 'ammo';

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface LevelConfig {
  id: number;
  name: string;
  bottleCount: number;
  ammo: number;
  timeLimit: number;
  magazineSize: number;
  movingTargets: boolean;
  spinningTargets: boolean;
  heavyCount: number;
  bonusCount: number;
  goldCount: number;
  bottleScale: number;
  moveSpeed: number;
  elevatedTargets: boolean;
  obstacles: boolean;
  scoreTarget: number;
}

export interface HudSnapshot {
  level: number;
  levelName: string;
  timeLeft: number;
  score: number;
  combo: number;
  accuracy: number;
  magazine: number;
  reserve: number;
  targeted: boolean;
  firing: boolean;
  reloading: boolean;
  reloadHint: boolean;
  bottlesLeft: number;
  bottlesTotal: number;
  shots: number;
  hits: number;
  hitPulse: boolean;
  perfectPulse: boolean;
}

export interface LevelStats {
  score: number;
  accuracy: number;
  shots: number;
  bottlesBroken: number;
  bestCombo: number;
}

export interface RunStats extends LevelStats {
  level: number;
  reason: GameOverReason;
}

export interface ScorePopup {
  id: number;
  text: string;
  kind: 'normal' | 'perfect' | 'combo' | 'bonus' | 'gold';
}

export type WorldEvent =
  | 'shot'
  | 'miss'
  | 'empty'
  | 'hit-glass'
  | 'crack'
  | 'shatter'
  | 'hit-wood'
  | 'hit-metal'
  | 'combo'
  | 'bonus'
  | 'gold'
  | 'perfect'
  | 'reload-start'
  | 'reload-end'
  | 'magazine-click'
  | 'level-complete'
  | 'out-of-ammo'
  | 'time-up';

export interface WorldEventExtra {
  combo?: number;
  points?: number;
  kind?: BottleKind;
  center?: boolean;
  pan?: number;
}

export interface WorldHooks {
  onHud: (hud: HudSnapshot) => void;
  onEvent: (event: WorldEvent, extra?: WorldEventExtra) => void;
}

export interface AudioSettings {
  muted: boolean;
  soundVolume: number;
  musicVolume: number;
}
