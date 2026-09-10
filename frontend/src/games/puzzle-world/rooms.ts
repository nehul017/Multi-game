import {
  DIRS,
  SHAPE_MASK,
  type GridPos,
  type PuzzleTile,
  type RoomDef,
  type RoomMood,
  type RoomRelic,
  type TileShape,
} from './types';

interface AtlasTemplate {
  id: string;
  cols: number;
  rows: number;
  gems: number;
  decoys: number;
  requires: string[];
}

const ATLAS_TEMPLATES: AtlasTemplate[] = [
  { id: '1', cols: 3, rows: 3, gems: 0, decoys: 0, requires: [] },
  { id: '2', cols: 3, rows: 3, gems: 0, decoys: 0, requires: ['1'] },
  { id: '3', cols: 3, rows: 3, gems: 1, decoys: 0, requires: ['1'] },
  { id: '4', cols: 4, rows: 4, gems: 0, decoys: 1, requires: ['2'] },
  { id: '5', cols: 4, rows: 4, gems: 1, decoys: 1, requires: ['2'] },
  { id: '6', cols: 4, rows: 4, gems: 1, decoys: 2, requires: ['3'] },
  { id: '7', cols: 5, rows: 4, gems: 1, decoys: 2, requires: ['4'] },
  { id: '8', cols: 5, rows: 5, gems: 1, decoys: 3, requires: ['5'] },
  { id: '9', cols: 5, rows: 5, gems: 2, decoys: 3, requires: ['6'] },
  { id: '10', cols: 5, rows: 5, gems: 2, decoys: 4, requires: ['7'] },
  { id: '11', cols: 5, rows: 5, gems: 2, decoys: 4, requires: ['8'] },
  { id: '12', cols: 5, rows: 5, gems: 2, decoys: 5, requires: ['10', '11'] },
];

const ATLAS_PLOTS: { x: number; y: number }[][] = [
  [
    { x: 8, y: 48 },
    { x: 22, y: 36 },
    { x: 22, y: 64 },
    { x: 38, y: 24 },
    { x: 38, y: 48 },
    { x: 38, y: 74 },
    { x: 56, y: 22 },
    { x: 56, y: 48 },
    { x: 56, y: 76 },
    { x: 74, y: 32 },
    { x: 74, y: 60 },
    { x: 90, y: 48 },
  ],
  [
    { x: 8, y: 52 },
    { x: 22, y: 64 },
    { x: 22, y: 36 },
    { x: 38, y: 76 },
    { x: 38, y: 52 },
    { x: 38, y: 26 },
    { x: 56, y: 78 },
    { x: 56, y: 52 },
    { x: 56, y: 24 },
    { x: 74, y: 68 },
    { x: 74, y: 40 },
    { x: 90, y: 52 },
  ],
  [
    { x: 10, y: 28 },
    { x: 24, y: 22 },
    { x: 22, y: 52 },
    { x: 40, y: 18 },
    { x: 38, y: 42 },
    { x: 36, y: 68 },
    { x: 58, y: 20 },
    { x: 56, y: 46 },
    { x: 54, y: 74 },
    { x: 76, y: 34 },
    { x: 74, y: 62 },
    { x: 90, y: 48 },
  ],
];

const PLACE_ADJ = [
  'Amber',
  'Cedar',
  'Cloud',
  'Copper',
  'Coral',
  'Drift',
  'Ember',
  'Frost',
  'Gilded',
  'Hidden',
  'Ivory',
  'Jade',
  'Lantern',
  'Mirror',
  'Moonlit',
  'Moss',
  'Opal',
  'Pastel',
  'Quiet',
  'Riddle',
  'Saffron',
  'Silver',
  'Sky',
  'Twilight',
  'Velvet',
  'Wandering',
];

const PLACE_NOUN = [
  'Arcade',
  'Archive',
  'Atrium',
  'Bridge',
  'Cloister',
  'Court',
  'Crossing',
  'Fountain',
  'Gallery',
  'Garden',
  'Gate',
  'Grove',
  'Harbor',
  'Hollow',
  'Keep',
  'Landing',
  'Market',
  'Meadow',
  'Observatory',
  'Orchard',
  'Pavilion',
  'Sanctum',
  'Spire',
  'Terrace',
  'Tower',
  'Vault',
  'Wharf',
  'Workshop',
];

const MOODS: RoomMood[] = ['dawn', 'garden', 'harbor', 'keep', 'market', 'frost', 'ember', 'sky'];
const RELICS: RoomRelic[] = ['crystal', 'lantern', 'coin', 'leaf', 'bell'];

export const RELIC_PLURAL: Record<RoomRelic, string> = {
  crystal: 'crystals',
  lantern: 'lanterns',
  coin: 'coins',
  leaf: 'leaves',
  bell: 'bells',
};

function pickHint(gems: number, decoys: number, relic: RoomRelic, rng: () => number): string {
  const relicWord = RELIC_PLURAL[relic];
  const withRelics = [
    `The path must visit every ${relic}.`,
    `Don’t leave a ${relic} hanging.`,
    `Thread the ${relicWord} before the door.`,
  ];
  const withDecoys = [
    'The spare tiles look helpful. They are not.',
    'Ignore the decoys. Follow the true aisle.',
    'A longer walk, with a few false turns.',
  ];
  const simple = [
    'Tap the middle tiles until the path snaps shut.',
    'One clean line from door to door.',
    'Bend the walk toward the exit.',
    'Two turns, one true line.',
  ];
  const both = [
    `Collect every ${relic}. Skip the decoys.`,
    `Thread the ${relicWord}, then close the door.`,
    `Winding stalls, one true aisle — and every ${relic}.`,
  ];

  const pool = gems > 0 && decoys > 0 ? both : gems > 0 ? withRelics : decoys > 0 ? withDecoys : simple;
  return pool[Math.floor(rng() * pool.length)];
}

function pickName(used: Set<string>, rng: () => number): string {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const name = `${PLACE_ADJ[Math.floor(rng() * PLACE_ADJ.length)]} ${PLACE_NOUN[Math.floor(rng() * PLACE_NOUN.length)]}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  const fallback = `Hidden Room ${used.size + 1}`;
  used.add(fallback);
  return fallback;
}

export function generateAtlas(runSeed = Date.now()): RoomDef[] {
  const rng = mulberry32(runSeed >>> 0);
  const used = new Set<string>();
  const plot = ATLAS_PLOTS[Math.floor(rng() * ATLAS_PLOTS.length)];

  return ATLAS_TEMPLATES.map((template, index) => {
    const swap = template.cols !== template.rows && rng() > 0.5;
    const gems = template.gems;
    const decoys = template.decoys;
    const relic = RELICS[Math.floor(rng() * RELICS.length)];
    const point = plot[index];
    const jitter = (value: number) => Math.max(8, Math.min(92, value + Math.floor(rng() * 7) - 3));

    return {
      id: template.id,
      name: pickName(used, rng),
      hint: pickHint(gems, decoys, relic, rng),
      cols: swap ? template.rows : template.cols,
      rows: swap ? template.cols : template.rows,
      seed: Math.floor(rng() * 0xffffffff) || runSeed + index * 97 + 13,
      gems,
      decoys,
      requires: template.requires.slice(),
      atlas: { x: jitter(point.x), y: jitter(point.y) },
      mood: MOODS[Math.floor(rng() * MOODS.length)],
      relic,
    };
  });
}

/** Default atlas used before a run starts. A new atlas is generated on each play. */
export const ATLAS_ROOMS: RoomDef[] = generateAtlas(20250910);

export const roomById = (rooms: RoomDef[], id: string): RoomDef => {
  const room = rooms.find((item) => item.id === id);
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

function findPath(cols: number, rows: number, rng: () => number, minLength: number): GridPos[] {
  const search = (): GridPos[] | null => {
    const startY = Math.min(rows - 1, Math.floor(rng() * rows));
    const start = { x: 0, y: startY };
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

  let best: GridPos[] | null = null;
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const found = search();
    if (!found) continue;
    if (found.length >= minLength) return found;
    if (!best || found.length > best.length) best = found;
  }

  if (best && best.length >= cols) return best;

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
  const rng = mulberry32(room.seed);
  const minLength = Math.min(
    room.cols * room.rows - Math.max(0, room.decoys),
    room.cols + room.rows - 1 + room.gems
  );
  const path = findPath(room.cols, room.rows, rng, minLength);
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
