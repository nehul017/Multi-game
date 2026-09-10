import {
  BODY_SEGMENT_SPACING,
  getPositionAlongPath,
  pathLength,
  prunePath,
  recordHead,
  samplePath,
  samplePathByDistance,
} from '../../games/coil-path';

describe('coil path sampling', () => {
  const line = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 30, y: 0 },
    { x: 30, y: 20 },
  ];

  it('walks a polyline and interpolates inside a segment', () => {
    expect(pathLength(line)).toBeCloseTo(50);
    expect(getPositionAlongPath(line, 0)).toEqual({ x: 0, y: 0 });
    expect(getPositionAlongPath(line, 10)).toEqual({ x: 10, y: 0 });
    const mid = getPositionAlongPath(line, 20);
    expect(mid.x).toBeCloseTo(20);
    expect(mid.y).toBeCloseTo(0);
    const corner = getPositionAlongPath(line, 40);
    expect(corner.x).toBeCloseTo(30);
    expect(corner.y).toBeCloseTo(10);
  });

  it('extrapolates past the tail for growth', () => {
    const past = getPositionAlongPath(line, 60);
    expect(past.x).toBeCloseTo(30);
    expect(past.y).toBeCloseTo(30);
  });

  it('samples a fixed world spacing independent of point count', () => {
    const segs = samplePath(line, 6, 10);
    expect(segs).toHaveLength(6);
    for (let i = 1; i < segs.length; i++) {
      const d = Math.hypot(segs[i].x - segs[i - 1].x, segs[i].y - segs[i - 1].y);
      expect(d).toBeCloseTo(10, 5);
    }
  });

  it('records heads by world distance instead of once per frame', () => {
    const path = [{ x: 0, y: 0 }];
    recordHead(path, { x: 0.4, y: 0 }, 2);
    expect(path).toHaveLength(1);
    expect(path[0].x).toBeCloseTo(0.4);
    recordHead(path, { x: 3, y: 0 }, 2);
    expect(path).toHaveLength(2);
    expect(path[0]).toEqual({ x: 3, y: 0 });
  });

  it('prunes history that is farther than the coil plus a margin', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 40, y: 0 },
      { x: 80, y: 0 },
    ];
    prunePath(path, 25);
    expect(pathLength(path)).toBeGreaterThanOrEqual(25);
    expect(path[path.length - 1].x).toBeLessThanOrEqual(40);
  });

  it('keeps a compact network path continuous', () => {
    const dense = samplePath(
      [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
      ],
      40,
      BODY_SEGMENT_SPACING
    );
    const compact = samplePathByDistance(dense, BODY_SEGMENT_SPACING * 2);
    expect(compact.length).toBeLessThan(dense.length);
    expect(pathLength(compact)).toBeCloseTo(pathLength(dense), 0);
  });
});
