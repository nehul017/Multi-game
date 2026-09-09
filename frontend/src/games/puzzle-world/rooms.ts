import { DIRS, SHAPE_MASK, type GridPos, type PuzzleTile, type RoomDef, type TileShape } from './types';

export const ATLAS_ROOMS: RoomDef[] = [
  { id: '1', name: 'Welcome Gate', hint: 'Tap the middle tile so the path snaps shut.', cols: 3, rows: 3, seed: 11, gems: 0, decoys: 0, requires: [], atlas: { x: 8, y: 48 } },
  { id: '2', name: 'Cloud Step', hint: 'Bend the path down the right-hand arch.', cols: 3, rows: 3, seed: 22, gems: 0, decoys: 0, requires: ['1'], atlas: { x: 22, y: 36 } },
  { id: '3', name: 'Pastel Court', hint: 'The path must visit the crystal.', cols: 3, rows: 3, seed: 33, gems: 1, decoys: 0, requires: ['1'], atlas: { x: 22, y: 64 } },
  { id: '4', name: 'Blue Arch', hint: 'Two turns, one clean line.', cols: 4, rows: 4, seed: 104, gems: 0, decoys: 1, requires: ['2'], atlas: { x: 38, y: 24 } },
  { id: '5', name: 'Pink Tower', hint: 'Climb, then cut across.', cols: 4, rows: 4, seed: 205, gems: 1, decoys: 1, requires: ['2'], atlas: { x: 38, y: 48 } },
  { id: '6', name: 'Sky Bridge', hint: 'Don’t leave the crystal hanging.', cols: 4, rows: 4, seed: 306, gems: 1, decoys: 2, requires: ['3'], atlas: { x: 38, y: 74 } },
  { id: '7', name: 'Lantern Lane', hint: 'A longer walk with a spare tile or two.', cols: 5, rows: 4, seed: 417, gems: 1, decoys: 2, requires: ['4'], atlas: { x: 56, y: 22 } },
  { id: '8', name: 'Mirror Garden', hint: 'The decoys look helpful. They are not.', cols: 5, rows: 5, seed: 518, gems: 1, decoys: 3, requires: ['5'], atlas: { x: 56, y: 48 } },
  { id: '9', name: 'Riddle Keep', hint: 'Thread both crystals before the door.', cols: 5, rows: 5, seed: 619, gems: 2, decoys: 3, requires: ['6'], atlas: { x: 56, y: 76 } },
  { id: '10', name: 'Drift Market', hint: 'Winding stalls, one true aisle.', cols: 5, rows: 5, seed: 710, gems: 2, decoys: 4, requires: ['7'], atlas: { x: 74, y: 32 } },
  { id: '11', name: 'High Atelier', hint: 'Almost the whole atlas is watching.', cols: 5, rows: 5, seed: 811, gems: 2, decoys: 4, requires: ['8'], atlas: { x: 74, y: 60 } },
  { id: '12', name: 'Atlas Heart', hint: 'Close the last room. Snap the world shut.', cols: 5, rows: 5, seed: 912, gems: 2, decoys: 5, requires: ['10', '11'], atlas: { x: 90, y: 48 } },
];

export const roomById = (id: string): RoomDef => {
  const room = ATLAS_ROOMS.find((item) => item.id === id);
  if (!room) throw new Error(`Unknown Puzzle World room ${id}`);
  return room;
};

export function rotateMask(mask: number, turns: number): number {
  let next = mask & 15;
  const steps = ((turns % 4) + 4) % 4;
  for (let i = 0; i < steps; i += 1) {
    next = ((next << 1) | (next >> 3)) & 15;
  }
  return next;
}

export function tileMask(tile: Pick<PuzzleTile, 'shape' | 'rot'>): number {
  return rotateMask(SHAPE_MASK[tile.shape], tile.rot);
}

export function encodeMask(mask: number): { shape: TileShape; rot: number } {
  const shapes: TileShape[] = ['I', 'L', 'T', 'X', 'C'];
  for (const shape of shapes) {
    for (let rot = 0; rot < 4; rot += 1) {
      if (rotateMask(SHAPE_MASK[shape], rot) === (mask & 15)) {
        return { shape, rot };
      }
    }
  }
  return { shape: 'C', rot: 0 };
}

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function inBounds(x: number, y: number, cols: number, rows: number): boolean {
  return x >= 0 && y >= 0 && x < cols && y < rows;
}

function findPath(cols: number, rows: number, rng: () => number): GridPos[] {
  const startY = Math.min(rows - 1, Math.floor(rng() * rows));
  const start = { x: 0, y: startY };

  const search = (): GridPos[] | null => {
    const stack: GridPos[] = [start];
    const parent = new Map<string, string | null>([[cellKey(start.x, start.y), null]]);
    const order = shuffle([...DIRS], rng);

    while (stack.length) {
      const current = stack.pop()!;
      if (current.x === cols - 1 && (current.x !== start.x || current.y !== start.y)) {
        const path: GridPos[] = [];
        let cursor: string | null = cellKey(current.x, current.y);
        while (cursor) {
          const [x, y] = cursor.split(',').map(Number);
          path.push({ x, y });
          cursor = parent.get(cursor) ?? null;
        }
        return path.reverse();
      }

      for (const dir of order) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        const key = cellKey(nx, ny);
        if (!inBounds(nx, ny, cols, rows) || parent.has(key)) continue;
        parent.set(key, cellKey(current.x, current.y));
        stack.push({ x: nx, y: ny });
      }
    }
    return null;
  };

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const found = search();
    if (found && found.length >= cols) return found;
  }

  const y = Math.floor(rows / 2);
  return Array.from({ length: cols }, (_, x) => ({ x, y }));
}

function neighborOnPath(a: GridPos, pathSet: Set<string>): number {
  let mask = 0;
  for (const dir of DIRS) {
    if (pathSet.has(cellKey(a.x + dir.dx, a.y + dir.dy))) mask |= dir.bit;
  }
  return mask;
}

export function connectedKeys(tiles: PuzzleTile[]): Set<string> {
  const byPos = new Map(tiles.map((tile) => [cellKey(tile.x, tile.y), tile]));
  const start = tiles.find((tile) => tile.role === 'start');
  const lit = new Set<string>();
  if (!start) return lit;

  const queue: GridPos[] = [{ x: start.x, y: start.y }];
  lit.add(cellKey(start.x, start.y));

  while (queue.length) {
    const current = queue.shift()!;
    const tile = byPos.get(cellKey(current.x, current.y));
    if (!tile || tile.role === 'empty') continue;
    const mask = tileMask(tile);
    for (const dir of DIRS) {
      if ((mask & dir.bit) === 0) continue;
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const next = byPos.get(cellKey(nx, ny));
      if (!next || next.role === 'empty') continue;
      if ((tileMask(next) & dir.opposite) === 0) continue;
      const key = cellKey(nx, ny);
      if (lit.has(key)) continue;
      lit.add(key);
      queue.push({ x: nx, y: ny });
    }
  }

  return lit;
}

export function isRoomSolved(tiles: PuzzleTile[]): boolean {
  const lit = connectedKeys(tiles);
  const goal = tiles.find((tile) => tile.role === 'goal');
  if (!goal || !lit.has(cellKey(goal.x, goal.y))) return false;
  return tiles.filter((tile) => tile.gem).every((tile) => lit.has(cellKey(tile.x, tile.y)));
}

function buildTutorial(room: RoomDef): PuzzleTile[] {
  if (room.id === '1') {
    return [
      { x: 0, y: 1, shape: 'C', rot: 1, role: 'start', gem: false, locked: true },
      { x: 1, y: 1, shape: 'I', rot: 1, role: 'path', gem: false, locked: false },
      { x: 2, y: 1, shape: 'C', rot: 3, role: 'goal', gem: false, locked: true },
    ];
  }

  if (room.id === '2') {
    return [
      { x: 0, y: 0, shape: 'C', rot: 1, role: 'start', gem: false, locked: true },
      { x: 1, y: 0, shape: 'I', rot: 1, role: 'path', gem: false, locked: false },
      { x: 2, y: 0, shape: 'L', rot: 2, role: 'path', gem: false, locked: false },
      { x: 2, y: 1, shape: 'I', rot: 0, role: 'path', gem: false, locked: false },
      { x: 2, y: 2, shape: 'C', rot: 0, role: 'goal', gem: false, locked: true },
    ];
  }

  return [
    { x: 0, y: 0, shape: 'C', rot: 1, role: 'start', gem: false, locked: true },
    { x: 1, y: 0, shape: 'L', rot: 2, role: 'path', gem: true, locked: false },
    { x: 1, y: 1, shape: 'I', rot: 0, role: 'path', gem: false, locked: false },
    { x: 1, y: 2, shape: 'L', rot: 0, role: 'path', gem: false, locked: false },
    { x: 2, y: 2, shape: 'C', rot: 3, role: 'goal', gem: false, locked: true },
  ];
}

function fillGrid(room: RoomDef, pathTiles: PuzzleTile[]): PuzzleTile[] {
  const occupied = new Set(pathTiles.map((tile) => cellKey(tile.x, tile.y)));
  const tiles = pathTiles.slice();
  for (let y = 0; y < room.rows; y += 1) {
    for (let x = 0; x < room.cols; x += 1) {
      if (occupied.has(cellKey(x, y))) continue;
      tiles.push({ x, y, shape: 'I', rot: 0, role: 'empty', gem: false, locked: true });
    }
  }
  return tiles;
}

export function buildSolvedRoom(room: RoomDef): PuzzleTile[] {
  if (room.id === '1' || room.id === '2' || room.id === '3') {
    return fillGrid(room, buildTutorial(room));
  }

  const rng = mulberry32(room.seed);
  const path = findPath(room.cols, room.rows, rng);
  const pathSet = new Set(path.map((pos) => cellKey(pos.x, pos.y)));
  const start = path[0];
  const goal = path[path.length - 1];
  const interior = path.slice(1, -1);
  const gemSpots = shuffle(interior, rng).slice(0, Math.min(room.gems, interior.length));
  const gemSet = new Set(gemSpots.map((pos) => cellKey(pos.x, pos.y)));

  const tiles: PuzzleTile[] = path.map((pos) => {
    let mask = neighborOnPath(pos, pathSet);
    if (pos.x === start.x && pos.y === start.y) {
      const next = path[1];
      mask = 0;
      for (const dir of DIRS) {
        if (pos.x + dir.dx === next.x && pos.y + dir.dy === next.y) mask = dir.bit;
      }
    }
    if (pos.x === goal.x && pos.y === goal.y) {
      const prev = path[path.length - 2];
      mask = 0;
      for (const dir of DIRS) {
        if (pos.x + dir.dx === prev.x && pos.y + dir.dy === prev.y) mask = dir.bit;
      }
    }
    const encoded = encodeMask(mask);
    const isStart = pos.x === start.x && pos.y === start.y;
    const isGoal = pos.x === goal.x && pos.y === goal.y;
    return {
      x: pos.x,
      y: pos.y,
      shape: encoded.shape,
      rot: encoded.rot,
      role: isStart ? 'start' : isGoal ? 'goal' : 'path',
      gem: gemSet.has(cellKey(pos.x, pos.y)),
      locked: isStart || isGoal,
    };
  });

  const empties: GridPos[] = [];
  for (let y = 0; y < room.rows; y += 1) {
    for (let x = 0; x < room.cols; x += 1) {
      if (!pathSet.has(cellKey(x, y))) empties.push({ x, y });
    }
  }

  const decoySpots = shuffle(empties, rng).slice(0, Math.min(room.decoys, empties.length));
  const decoySet = new Set(decoySpots.map((pos) => cellKey(pos.x, pos.y)));
  const decoyShapes: TileShape[] = ['I', 'L', 'T'];

  for (const pos of empties) {
    if (decoySet.has(cellKey(pos.x, pos.y))) {
      tiles.push({
        x: pos.x,
        y: pos.y,
        shape: decoyShapes[Math.floor(rng() * decoyShapes.length)],
        rot: Math.floor(rng() * 4),
        role: 'decoy',
        gem: false,
        locked: false,
      });
    } else {
      tiles.push({ x: pos.x, y: pos.y, shape: 'I', rot: 0, role: 'empty', gem: false, locked: true });
    }
  }

  if (!isRoomSolved(tiles)) {
    return fillGrid(room, [
      ...Array.from({ length: room.cols }, (_, x) => {
        const y = Math.floor(room.rows / 2);
        if (x === 0) return { x, y, shape: 'C' as const, rot: 1, role: 'start' as const, gem: false, locked: true };
        if (x === room.cols - 1) return { x, y, shape: 'C' as const, rot: 3, role: 'goal' as const, gem: false, locked: true };
        return { x, y, shape: 'I' as const, rot: 1, role: 'path' as const, gem: false, locked: false };
      }),
    ]);
  }

  return tiles;
}

export function scrambleRoom(room: RoomDef, solved: PuzzleTile[]): PuzzleTile[] {
  const rng = mulberry32(room.seed + 97);
  const apply = (turnsBias: number): PuzzleTile[] =>
    solved.map((tile) => {
      if (tile.locked || tile.role === 'empty') return { ...tile };
      const extra = 1 + Math.floor(rng() * 3) + (turnsBias > 0 && rng() > 0.5 ? 1 : 0);
      return { ...tile, rot: (tile.rot + extra) % 4 };
    });

  for (let attempt = 0; attempt < 16; attempt += 1) {
    const next = apply(attempt);
    if (!isRoomSolved(next)) return next;
  }

  return solved.map((tile) =>
    tile.locked || tile.role === 'empty' ? { ...tile } : { ...tile, rot: (tile.rot + 1) % 4 }
  );
}

export function selectableTiles(tiles: PuzzleTile[]): PuzzleTile[] {
  return tiles.filter((tile) => !tile.locked && tile.role !== 'empty');
}

export function roomScore(roomMoves: number, durationMs: number): number {
  const efficiency = Math.max(0, 24 - roomMoves) * 12;
  const timeBonus = Math.max(0, 40 - Math.floor(durationMs / 1000)) * 5;
  return 280 + efficiency + timeBonus;
}

export const ATLAS_COMPLETE_BONUS = 1000;
