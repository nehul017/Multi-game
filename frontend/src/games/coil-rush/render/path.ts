export interface PathPoint {
  x: number;
  y: number;
}

/** Matches server BODY_SEGMENT_SPACING — world units, not pixels. */
export const BODY_SEGMENT_SPACING = 7.2;

/** Record a pin after this much world travel so spacing stays FPS-independent. */
export const PATH_RECORD_MIN = 2;

const EPS = 1e-6;
const TELEPORT_RESET = 160;

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

export function visualSegmentSpacing(radius: number): number {
  const r = radius > 0 ? radius : 9;
  return Math.max(5, Math.min(BODY_SEGMENT_SPACING, r * 0.82));
}

export function seedPath(dest: PathPoint[], source: PathPoint[]): void {
  dest.length = source.length;
  for (let i = 0; i < source.length; i++) {
    const p = source[i];
    if (dest[i]) {
      dest[i].x = p.x;
      dest[i].y = p.y;
    } else {
      dest[i] = { x: p.x, y: p.y };
    }
  }
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

export function shouldResetTrail(trail: PathPoint[], head: PathPoint, alive: boolean): boolean {
  if (!trail.length || !alive) return true;
  const first = trail[0];
  return Math.hypot(head.x - first.x, head.y - first.y) > TELEPORT_RESET;
}

export function logicalCoilDistance(body: PathPoint[], logicalLength?: number, spacing = BODY_SEGMENT_SPACING): number {
  const fromBody = pathLength(body);
  const fromCount = Math.max(0, (logicalLength ?? body.length) - 1) * spacing;
  return Math.max(fromBody, fromCount);
}
