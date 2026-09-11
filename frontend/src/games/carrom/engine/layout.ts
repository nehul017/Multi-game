import type { CarromPiece } from '../types';
import { BASELINE, BOARD, COIN_R } from './physics';

const CENTER = BOARD / 2;
const GAP = COIN_R * 2.04;

const ring = (count: number, radius: number, start: number): Array<{ x: number; y: number }> => {
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const angle = start + (i * Math.PI * 2) / count;
    out.push({ x: CENTER + Math.cos(angle) * radius, y: CENTER + Math.sin(angle) * radius });
  }
  return out;
};

export const createOpeningPieces = (): CarromPiece[] => {
  const pieces: CarromPiece[] = [
    { id: 'queen', kind: 'queen', x: CENTER, y: CENTER, vx: 0, vy: 0, pocketed: false },
  ];
  ring(6, GAP, Math.PI / 6).forEach((pos, index) => {
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
  ring(12, GAP * 2, 0).forEach((pos, index) => {
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
    y: BOARD - BASELINE,
    vx: 0,
    vy: 0,
    pocketed: false,
  });
  return pieces;
};
