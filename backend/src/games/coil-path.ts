export interface PathPoint {
  x: number;
  y: number;
}

/** World-space distance between consecutive logical body samples. */
export const BODY_SEGMENT_SPACING = 7.2;

/** Ignore micro-jitter; still smaller than a normal or boost tick step. */
export const PATH_RECORD_MIN = 1.5;

const EPS = 1e-6;

export function pathLength(path: PathPoint[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  }
  return total;
}

export function getPositionAlongPath(path: PathPoint[], distance: number, out?: PathPoint): PathPoint {
  const result = out || { x: 0, y: 0 };
  if (!path.length) {
    result.x = 0;
    result.y = 0;
    return result;
  }
  if (path.length === 1 || distance <= 0) {
    result.x = path[0].x;
    result.y = path[0].y;
    return result;
  }

  let remaining = distance;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].x - path[i].x;
    const dy = path[i + 1].y - path[i].y;
    const seg = Math.hypot(dx, dy);
    if (seg >= remaining) {
      const t = seg < EPS ? 0 : remaining / seg;
      result.x = path[i].x + dx * t;
      result.y = path[i].y + dy * t;
      return result;
    }
    remaining -= seg;
  }

  const last = path[path.length - 1];
  const prev = path[path.length - 2];
  const dx = last.x - prev.x;
  const dy = last.y - prev.y;
  const seg = Math.hypot(dx, dy);
  if (seg < EPS) {
    result.x = last.x;
    result.y = last.y;
    return result;
  }
  result.x = last.x + (dx / seg) * remaining;
  result.y = last.y + (dy / seg) * remaining;
  return result;
}

export function samplePath(path: PathPoint[], count: number, spacing: number, out?: PathPoint[]): PathPoint[] {
  const dest = out || [];
  const n = Math.max(0, Math.floor(count));
  dest.length = n;
  if (n === 0) return dest;

  const write = (i: number, x: number, y: number) => {
    if (dest[i]) {
      dest[i].x = x;
      dest[i].y = y;
    } else {
      dest[i] = { x, y };
    }
  };

  if (!path.length) {
    for (let i = 0; i < n; i++) write(i, 0, 0);
    return dest;
  }
  if (path.length === 1) {
    for (let i = 0; i < n; i++) write(i, path[0].x, path[0].y);
    return dest;
  }

  let idx = 0;
  let traveled = 0;
  let ax = path[0].x;
  let ay = path[0].y;
  let bx = path[1].x;
  let by = path[1].y;
  let segLen = Math.hypot(bx - ax, by - ay);
  write(0, ax, ay);

  for (let i = 1; i < n; i++) {
    const target = i * spacing;
    while (idx < path.length - 2 && traveled + segLen < target - EPS) {
      traveled += segLen;
      idx += 1;
      ax = path[idx].x;
      ay = path[idx].y;
      bx = path[idx + 1].x;
      by = path[idx + 1].y;
      segLen = Math.hypot(bx - ax, by - ay);
    }
    const remain = target - traveled;
    if (idx >= path.length - 2 && remain > segLen) {
      const last = path[path.length - 1];
      const prev = path[path.length - 2];
      const dx = last.x - prev.x;
      const dy = last.y - prev.y;
      const len = Math.hypot(dx, dy);
      const extra = remain - segLen;
      if (len < EPS) write(i, last.x, last.y);
      else write(i, last.x + (dx / len) * extra, last.y + (dy / len) * extra);
      continue;
    }
    if (segLen < EPS) write(i, ax, ay);
    else {
      const t = remain / segLen;
      write(i, ax + (bx - ax) * t, ay + (by - ay) * t);
    }
  }
  return dest;
}

export function samplePathByDistance(path: PathPoint[], spacing: number): PathPoint[] {
  if (!path.length) return [];
  const step = Math.max(EPS, spacing);
  const total = pathLength(path);
  const count = Math.max(1, Math.floor(total / step) + 1);
  const out = samplePath(path, count, step);
  const tail = path[path.length - 1];
  const last = out[out.length - 1];
  if (Math.hypot(tail.x - last.x, tail.y - last.y) > step * 0.25) {
    out.push({ x: tail.x, y: tail.y });
  }
  return out;
}

export function recordHead(path: PathPoint[], head: PathPoint, minStep = PATH_RECORD_MIN): void {
  if (!path.length) {
    path.push({ x: head.x, y: head.y });
    return;
  }
  const prev = path[0];
  const dist = Math.hypot(head.x - prev.x, head.y - prev.y);
  if (dist >= minStep) {
    path.unshift({ x: head.x, y: head.y });
    return;
  }
  prev.x = head.x;
  prev.y = head.y;
}

export function prunePath(path: PathPoint[], maxDistance: number): void {
  if (path.length <= 2) return;
  let acc = 0;
  let keep = 1;
  for (let i = 1; i < path.length; i++) {
    acc += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    keep = i;
    if (acc >= maxDistance) break;
  }
  if (keep + 1 < path.length) path.length = keep + 1;
}

export function clonePath(path: PathPoint[]): PathPoint[] {
  return path.map((p) => ({ x: p.x, y: p.y }));
}
