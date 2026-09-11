import { CARROM_BASELINE, CARROM_BOARD, CARROM_COIN_RADIUS } from './constants';
import type { CarromColor, CarromPiece } from './types';

const CENTER = CARROM_BOARD / 2;
const GAP = CARROM_COIN_RADIUS * 2.04;

const ringPositions = (count: number, radius: number, startAngle: number): Array<{ x: number; y: number }> => {
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const angle = startAngle + (i * Math.PI * 2) / count;
    out.push({
      x: CENTER + Math.cos(angle) * radius,
      y: CENTER + Math.sin(angle) * radius,
    });
  }
  return out;
};

export const createOpeningPieces = (): CarromPiece[] => {
  const pieces: CarromPiece[] = [
    { id: 'queen', kind: 'queen', x: CENTER, y: CENTER, vx: 0, vy: 0, pocketed: false },
  ];

  const inner = ringPositions(6, GAP, Math.PI / 6);
  inner.forEach((pos, index) => {
    pieces.push({
      id: `inner-${index}`,
      kind: index % 2 === 0 ? 'white' : 'black',
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      pocketed: false,
    });
  });

  const outer = ringPositions(12, GAP * 2, 0);
  outer.forEach((pos, index) => {
    pieces.push({
      id: `outer-${index}`,
      kind: index % 2 === 0 ? 'black' : 'white',
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      pocketed: false,
    });
  });

  pieces.push({
    id: 'striker',
    kind: 'striker',
    x: CENTER,
    y: CARROM_BOARD - CARROM_BASELINE,
    vx: 0,
    vy: 0,
    pocketed: false,
  });

  return pieces;
};

export const baselineForColor = (color: CarromColor): { axis: 'x' | 'y'; value: number; min: number; max: number } => {
  if (color === 'white') {
    return { axis: 'x', value: CARROM_BOARD - CARROM_BASELINE, min: 156, max: 844 };
  }
  return { axis: 'x', value: CARROM_BASELINE, min: 156, max: 844 };
};

export const defaultStrikerPosition = (color: CarromColor): { x: number; y: number } => {
  const line = baselineForColor(color);
  if (color === 'white') return { x: CENTER, y: line.value };
  return { x: CENTER, y: line.value };
};

export const clampToBaseline = (
  color: CarromColor,
  x: number,
  y: number
): { x: number; y: number } => {
  const line = baselineForColor(color);
  const along = Math.min(line.max, Math.max(line.min, line.axis === 'x' ? x : y));
  if (color === 'white') return { x: along, y: line.value };
  return { x: along, y: line.value };
};
