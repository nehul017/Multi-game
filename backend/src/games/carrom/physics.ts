import {
  CARROM_BOARD,
  CARROM_COIN_RESTITUTION,
  CARROM_DT,
  CARROM_FRICTION,
  CARROM_MAX_SPEED,
  CARROM_MAX_STEPS,
  CARROM_MIN_POWER,
  CARROM_POCKETS,
  CARROM_POCKET_RADIUS,
  CARROM_REST_SPEED,
  CARROM_WALL_RESTITUTION,
  pieceMass,
  pieceRadius,
} from './constants';
import type { CarromPiece, CarromShotEvent, CarromShotInput } from './types';

const clonePieces = (pieces: CarromPiece[]): CarromPiece[] =>
  pieces.map((piece) => ({ ...piece }));

const speedOf = (piece: CarromPiece): number => Math.hypot(piece.vx, piece.vy);

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const clampPower = (power: number): number => clamp(power, CARROM_MIN_POWER, 1);

export const applyShotImpulse = (striker: CarromPiece, input: CarromShotInput): void => {
  const power = clampPower(input.power);
  const speed = power * CARROM_MAX_SPEED;
  striker.x = input.strikerX;
  striker.y = input.strikerY;
  striker.vx = Math.cos(input.angle) * speed;
  striker.vy = Math.sin(input.angle) * speed;
  striker.pocketed = false;
};

const pocketThreshold = (kind: CarromPiece['kind']): number =>
  CARROM_POCKET_RADIUS - pieceRadius(kind) * 0.28;

const tryPocket = (piece: CarromPiece, t: number, events: CarromShotEvent[]): boolean => {
  if (piece.pocketed) return false;
  for (const pocket of CARROM_POCKETS) {
    const dist = Math.hypot(piece.x - pocket.x, piece.y - pocket.y);
    if (dist <= pocketThreshold(piece.kind)) {
      piece.pocketed = true;
      piece.vx = 0;
      piece.vy = 0;
      piece.x = pocket.x;
      piece.y = pocket.y;
      events.push({ t, type: 'pocket', pieceId: piece.id, kind: piece.kind });
      return true;
    }
  }
  return false;
};

const collideWalls = (piece: CarromPiece, t: number, events: CarromShotEvent[]): void => {
  if (piece.pocketed) return;
  const r = pieceRadius(piece.kind);
  let hit = false;
  if (piece.x < r) {
    piece.x = r;
    piece.vx = Math.abs(piece.vx) * CARROM_WALL_RESTITUTION;
    hit = true;
  } else if (piece.x > CARROM_BOARD - r) {
    piece.x = CARROM_BOARD - r;
    piece.vx = -Math.abs(piece.vx) * CARROM_WALL_RESTITUTION;
    hit = true;
  }
  if (piece.y < r) {
    piece.y = r;
    piece.vy = Math.abs(piece.vy) * CARROM_WALL_RESTITUTION;
    hit = true;
  } else if (piece.y > CARROM_BOARD - r) {
    piece.y = CARROM_BOARD - r;
    piece.vy = -Math.abs(piece.vy) * CARROM_WALL_RESTITUTION;
    hit = true;
  }
  if (hit && speedOf(piece) > 40) {
    events.push({ t, type: 'wall', pieceId: piece.id, kind: piece.kind });
  }
};

const collidePieces = (
  a: CarromPiece,
  b: CarromPiece,
  t: number,
  events: CarromShotEvent[]
): void => {
  if (a.pocketed || b.pocketed) return;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const minDist = pieceRadius(a.kind) + pieceRadius(b.kind);
  const distSq = dx * dx + dy * dy;
  if (distSq === 0 || distSq >= minDist * minDist) return;

  const dist = Math.sqrt(distSq);
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  const massA = pieceMass(a.kind);
  const massB = pieceMass(b.kind);
  const inv = 1 / (massA + massB);
  a.x -= nx * overlap * massB * inv;
  a.y -= ny * overlap * massB * inv;
  b.x += nx * overlap * massA * inv;
  b.y += ny * overlap * massA * inv;

  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const velAlong = rvx * nx + rvy * ny;
  if (velAlong > 0) return;
  if (
    speedOf(a) < CARROM_REST_SPEED &&
    speedOf(b) < CARROM_REST_SPEED &&
    Math.abs(velAlong) < CARROM_REST_SPEED
  ) {
    return;
  }

  const e = CARROM_COIN_RESTITUTION;
  const impulse = (-(1 + e) * velAlong) / (1 / massA + 1 / massB);
  a.vx -= (impulse / massA) * nx;
  a.vy -= (impulse / massA) * ny;
  b.vx += (impulse / massB) * nx;
  b.vy += (impulse / massB) * ny;

  if (Math.abs(velAlong) > 30) {
    events.push({ t, type: 'collision', pieceId: a.id, otherId: b.id, kind: a.kind });
  }
};

const integrate = (piece: CarromPiece): void => {
  if (piece.pocketed) return;
  piece.x += piece.vx * CARROM_DT;
  piece.y += piece.vy * CARROM_DT;
  piece.vx *= CARROM_FRICTION;
  piece.vy *= CARROM_FRICTION;
  if (speedOf(piece) < CARROM_REST_SPEED) {
    piece.vx = 0;
    piece.vy = 0;
  }
};

const allResting = (pieces: CarromPiece[]): boolean =>
  pieces.every((piece) => piece.pocketed || speedOf(piece) < CARROM_REST_SPEED);

export interface SimulatedShot {
  pieces: CarromPiece[];
  events: CarromShotEvent[];
  durationMs: number;
  pocketedIds: string[];
}

export const simulateShot = (start: CarromPiece[], input: CarromShotInput): SimulatedShot => {
  const pieces = clonePieces(start);
  const striker = pieces.find((piece) => piece.kind === 'striker');
  if (!striker) {
    return { pieces, events: [], durationMs: 0, pocketedIds: [] };
  }

  applyShotImpulse(striker, input);
  const events: CarromShotEvent[] = [];
  const pocketed = new Set<string>();
  let steps = 0;

  while (steps < CARROM_MAX_STEPS) {
    const t = steps * CARROM_DT;
    for (const piece of pieces) integrate(piece);
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        collidePieces(pieces[i], pieces[j], t, events);
      }
    }
    for (const piece of pieces) {
      collideWalls(piece, t, events);
      if (tryPocket(piece, t, events)) pocketed.add(piece.id);
    }
    steps += 1;
    if (steps > 8 && allResting(pieces)) break;
  }

  events.push({ t: steps * CARROM_DT, type: 'rest' });
  return {
    pieces,
    events,
    durationMs: Math.round(steps * CARROM_DT * 1000),
    pocketedIds: [...pocketed],
  };
};

export const placeStrikerSafe = (
  pieces: CarromPiece[],
  x: number,
  y: number
): { x: number; y: number } => {
  const striker = pieces.find((piece) => piece.kind === 'striker');
  if (!striker) return { x, y };
  let px = x;
  let py = y;
  const radius = pieceRadius('striker');
  for (let attempt = 0; attempt < 8; attempt++) {
    let pushed = false;
    for (const piece of pieces) {
      if (piece.kind === 'striker' || piece.pocketed) continue;
      const dx = px - piece.x;
      const dy = py - piece.y;
      const min = radius + pieceRadius(piece.kind) + 1.5;
      const dist = Math.hypot(dx, dy);
      if (dist < min && dist > 0) {
        px += (dx / dist) * (min - dist);
        py += (dy / dist) * (min - dist);
        pushed = true;
      }
    }
    if (!pushed) break;
  }
  return {
    x: clamp(px, radius, CARROM_BOARD - radius),
    y: clamp(py, radius, CARROM_BOARD - radius),
  };
};
