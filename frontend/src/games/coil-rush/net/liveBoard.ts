import type { CoilBoard } from '../types';

type Listener = (board: CoilBoard) => void;

let board: CoilBoard = {};
const listeners = new Set<Listener>();

export const coilLive = {
  get(): CoilBoard {
    return board;
  },
  set(next: unknown) {
    if (!next || typeof next !== 'object') return;
    board = next as CoilBoard;
    listeners.forEach((fn) => fn(board));
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

export const isCoilBoard = (value: unknown): value is CoilBoard =>
  Boolean(value && typeof value === 'object' && Array.isArray((value as CoilBoard).snakes));
