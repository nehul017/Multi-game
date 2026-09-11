export const CARROM_BOARD = 1000;
export const CARROM_COIN_RADIUS = 20.4;
export const CARROM_STRIKER_RADIUS = 27.2;
export const CARROM_POCKET_RADIUS = 41;
export const CARROM_POCKET_INSET = 10;
export const CARROM_BASELINE = 118;
export const CARROM_STRIKER_MIN = 156;
export const CARROM_STRIKER_MAX = 844;
export const CARROM_DT = 1 / 120;
export const CARROM_FRICTION = 0.9892;
export const CARROM_REST_SPEED = 6.5;
export const CARROM_WALL_RESTITUTION = 0.58;
export const CARROM_COIN_RESTITUTION = 0.84;
export const CARROM_COIN_MASS = 1;
export const CARROM_STRIKER_MASS = 1.72;
export const CARROM_MIN_POWER = 0.08;
export const CARROM_MAX_SPEED = 1680;
export const CARROM_MAX_STEPS = 2400;
export const CARROM_DEFAULT_POINTS = 5;
export const CARROM_QUEEN_POINTS = 3;

export const CARROM_POCKETS: ReadonlyArray<{ x: number; y: number }> = [
  { x: CARROM_POCKET_INSET, y: CARROM_POCKET_INSET },
  { x: CARROM_BOARD - CARROM_POCKET_INSET, y: CARROM_POCKET_INSET },
  { x: CARROM_BOARD - CARROM_POCKET_INSET, y: CARROM_BOARD - CARROM_POCKET_INSET },
  { x: CARROM_POCKET_INSET, y: CARROM_BOARD - CARROM_POCKET_INSET },
];

export const pieceRadius = (kind: 'white' | 'black' | 'queen' | 'striker'): number =>
  kind === 'striker' ? CARROM_STRIKER_RADIUS : CARROM_COIN_RADIUS;

export const pieceMass = (kind: 'white' | 'black' | 'queen' | 'striker'): number =>
  kind === 'striker' ? CARROM_STRIKER_MASS : CARROM_COIN_MASS;
