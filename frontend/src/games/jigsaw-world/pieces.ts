import { TAB, type EdgeKind, type JigsawPiece } from './types';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomTab(rng: () => number): EdgeKind {
  return rng() > 0.5 ? 1 : -1;
}

export function buildEdges(cols: number, rows: number, seed: number): JigsawPiece['edges'][][] {
  const rng = mulberry32(seed);
  const grid: JigsawPiece['edges'][][] = [];

  for (let row = 0; row < rows; row += 1) {
    grid[row] = [];
    for (let col = 0; col < cols; col += 1) {
      const left: EdgeKind = col === 0 ? 0 : ((-grid[row][col - 1].right) as EdgeKind);
      const top: EdgeKind = row === 0 ? 0 : ((-grid[row - 1][col].bottom) as EdgeKind);
      const right: EdgeKind = col === cols - 1 ? 0 : randomTab(rng);
      const bottom: EdgeKind = row === rows - 1 ? 0 : randomTab(rng);
      grid[row][col] = { top, right, bottom, left };
    }
  }

  return grid;
}

function fmt(value: number): string {
  return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function bump(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  tab: EdgeKind
): string {
  if (tab === 0) {
    return `L ${fmt(bx)} ${fmt(by)}`;
  }

  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = uy;
  const py = -ux;
  const depth = TAB * tab;

  const point = (t: number, out: number) => ({
    x: ax + ux * t * len + px * out,
    y: ay + uy * t * len + py * out,
  });

  const a = point(0.34, 0);
  const b = point(0.4, depth * 0.28);
  const c = point(0.33, depth * 0.72);
  const d = point(0.5, depth);
  const e = point(0.67, depth * 0.72);
  const f = point(0.6, depth * 0.28);
  const g = point(0.66, 0);

  return [
    `L ${fmt(a.x)} ${fmt(a.y)}`,
    `C ${fmt(b.x)} ${fmt(b.y)} ${fmt(c.x)} ${fmt(c.y)} ${fmt(d.x)} ${fmt(d.y)}`,
    `C ${fmt(e.x)} ${fmt(e.y)} ${fmt(f.x)} ${fmt(f.y)} ${fmt(g.x)} ${fmt(g.y)}`,
    `L ${fmt(bx)} ${fmt(by)}`,
  ].join(' ');
}

export function piecePath(edges: JigsawPiece['edges']): string {
  const top = bump(0, 0, 1, 0, edges.top);
  const right = bump(1, 0, 1, 1, edges.right);
  const bottom = bump(1, 1, 0, 1, edges.bottom);
  const left = bump(0, 1, 0, 0, edges.left);
  return `M 0 0 ${top} ${right} ${bottom} ${left} Z`;
}

export function scatterPiece(_index: number, _total: number, rng: () => number): { x: number; y: number } {
  return {
    x: rng(),
    y: 1.2 + rng() * 0.08,
  };
}

export function puzzleScore(level: number, pieces: number, durationMs: number): number {
  const seconds = Math.max(0, Math.floor(durationMs / 1000));
  const timeBonus = Math.max(0, pieces * 8 - seconds) * 4;
  return level * 400 + timeBonus + 200;
}

export function maxPuzzleScore(level: number, pieces: number): number {
  return level * 400 + pieces * 8 * 4 + 200;
}
