import type { CarromPiece, CarromShotEvent, CarromShotInput } from '../types';

export const BOARD = 1000;
export const COIN_R = 20.4;
export const STRIKER_R = 27.2;
export const POCKET_R = 41;
export const POCKET_INSET = 10;
export const BASELINE = 118;
export const STRIKER_MIN = 156;
export const STRIKER_MAX = 844;
export const DT = 1 / 120;
export const FRICTION = 0.9892;
export const REST_SPEED = 6.5;
export const WALL_REST = 0.58;
export const COIN_REST = 0.84;
export const COIN_MASS = 1;
export const STRIKER_MASS = 1.72;
export const MIN_POWER = 0.08;
export const MAX_SPEED = 1680;
export const MAX_STEPS = 2400;

export const POCKETS = [
  { x: POCKET_INSET, y: POCKET_INSET },
  { x: BOARD - POCKET_INSET, y: POCKET_INSET },
  { x: BOARD - POCKET_INSET, y: BOARD - POCKET_INSET },
  { x: POCKET_INSET, y: BOARD - POCKET_INSET },
] as const;

export const radiusOf = (kind: CarromPiece['kind']): number =>
  kind === 'striker' ? STRIKER_R : COIN_R;

export const massOf = (kind: CarromPiece['kind']): number =>
  kind === 'striker' ? STRIKER_MASS : COIN_MASS;

const clonePieces = (pieces: CarromPiece[]): CarromPiece[] => pieces.map((piece) => ({ ...piece }));
const speedOf = (piece: CarromPiece): number => Math.hypot(piece.vx, piece.vy);
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const clampPower = (power: number): number => clamp(power, MIN_POWER, 1);

export const applyImpulse = (striker: CarromPiece, input: CarromShotInput): void => {
  const speed = clampPower(input.power) * MAX_SPEED;
  striker.x = input.strikerX;
  striker.y = input.strikerY;
  striker.vx = Math.cos(input.angle) * speed;
  striker.vy = Math.sin(input.angle) * speed;
  striker.pocketed = false;
};

const pocketThreshold = (kind: CarromPiece['kind']): number => POCKET_R - radiusOf(kind) * 0.28;

export const tryPocket = (piece: CarromPiece): boolean => {
  if (piece.pocketed) return false;
  for (const pocket of POCKETS) {
    if (Math.hypot(piece.x - pocket.x, piece.y - pocket.y) <= pocketThreshold(piece.kind)) {
      piece.pocketed = true;
      piece.vx = 0;
      piece.vy = 0;
      piece.x = pocket.x;
      piece.y = pocket.y;
      return true;
    }
  }
  return false;
};

export const collideWalls = (piece: CarromPiece): boolean => {
  if (piece.pocketed) return false;
  const r = radiusOf(piece.kind);
  let hit = false;
  if (piece.x < r) {
    piece.x = r;
    piece.vx = Math.abs(piece.vx) * WALL_REST;
    hit = true;
  } else if (piece.x > BOARD - r) {
    piece.x = BOARD - r;
    piece.vx = -Math.abs(piece.vx) * WALL_REST;
    hit = true;
  }
  if (piece.y < r) {
    piece.y = r;
    piece.vy = Math.abs(piece.vy) * WALL_REST;
    hit = true;
  } else if (piece.y > BOARD - r) {
    piece.y = BOARD - r;
    piece.vy = -Math.abs(piece.vy) * WALL_REST;
    hit = true;
  }
  return hit;
};

export const collidePieces = (a: CarromPiece, b: CarromPiece): number => {
  if (a.pocketed || b.pocketed) return 0;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const minDist = radiusOf(a.kind) + radiusOf(b.kind);
  const distSq = dx * dx + dy * dy;
  if (distSq === 0 || distSq >= minDist * minDist) return 0;
  const dist = Math.sqrt(distSq);
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  const massA = massOf(a.kind);
  const massB = massOf(b.kind);
  const inv = 1 / (massA + massB);
  a.x -= nx * overlap * massB * inv;
  a.y -= ny * overlap * massB * inv;
  b.x += nx * overlap * massA * inv;
  b.y += ny * overlap * massA * inv;
  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const velAlong = rvx * nx + rvy * ny;
  if (velAlong > 0) return 0;
  if (speedOf(a) < REST_SPEED && speedOf(b) < REST_SPEED && Math.abs(velAlong) < REST_SPEED) {
    return 0;
  }
  const impulse = (-(1 + COIN_REST) * velAlong) / (1 / massA + 1 / massB);
  a.vx -= (impulse / massA) * nx;
  a.vy -= (impulse / massA) * ny;
  b.vx += (impulse / massB) * nx;
  b.vy += (impulse / massB) * ny;
  return Math.abs(velAlong);
};

export const integrate = (piece: CarromPiece): void => {
  if (piece.pocketed) return;
  piece.x += piece.vx * DT;
  piece.y += piece.vy * DT;
  piece.vx *= FRICTION;
  piece.vy *= FRICTION;
  if (speedOf(piece) < REST_SPEED) {
    piece.vx = 0;
    piece.vy = 0;
  }
};

export const allResting = (pieces: CarromPiece[]): boolean =>
  pieces.every((piece) => piece.pocketed || speedOf(piece) < REST_SPEED);

export interface StepReport {
  pockets: CarromPiece[];
  collisions: number;
  walls: number;
}

export const stepWorld = (pieces: CarromPiece[]): StepReport => {
  const pockets: CarromPiece[] = [];
  let collisions = 0;
  let walls = 0;
  for (const piece of pieces) integrate(piece);
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      const impact = collidePieces(pieces[i], pieces[j]);
      if (impact > 30) collisions += 1;
    }
  }
  for (const piece of pieces) {
    if (collideWalls(piece) && speedOf(piece) > 40) walls += 1;
    if (tryPocket(piece)) pockets.push(piece);
  }
  return { pockets, collisions, walls };
};

export const simulateShot = (
  start: CarromPiece[],
  input: CarromShotInput
): { pieces: CarromPiece[]; events: CarromShotEvent[]; durationMs: number; pocketedIds: string[] } => {
  const pieces = clonePieces(start);
  const striker = pieces.find((piece) => piece.kind === 'striker');
  if (!striker) return { pieces, events: [], durationMs: 0, pocketedIds: [] };
  applyImpulse(striker, input);
  const events: CarromShotEvent[] = [];
  const pocketed = new Set<string>();
  let steps = 0;
  while (steps < MAX_STEPS) {
    const t = steps * DT;
    const report = stepWorld(pieces);
    for (const piece of report.pockets) {
      pocketed.add(piece.id);
      events.push({ t, type: 'pocket', pieceId: piece.id, kind: piece.kind });
    }
    if (report.collisions) events.push({ t, type: 'collision' });
    if (report.walls) events.push({ t, type: 'wall' });
    steps += 1;
    if (steps > 8 && allResting(pieces)) break;
  }
  events.push({ t: steps * DT, type: 'rest' });
  return { pieces, events, durationMs: Math.round(steps * DT * 1000), pocketedIds: [...pocketed] };
};

export const clampToBaseline = (
  color: 'white' | 'black',
  x: number
): { x: number; y: number } => {
  const along = clamp(x, STRIKER_MIN, STRIKER_MAX);
  return { x: along, y: color === 'white' ? BOARD - BASELINE : BASELINE };
};
