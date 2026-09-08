import type { PaylineDef } from './types';

export const FRUIT_SLOT_PAYLINES: readonly PaylineDef[] = [
  { id: 'middle', name: 'Middle', pattern: [1, 1, 1, 1, 1] },
  { id: 'top', name: 'Top', pattern: [0, 0, 0, 0, 0] },
  { id: 'bottom', name: 'Bottom', pattern: [2, 2, 2, 2, 2] },
  { id: 'v', name: 'V', pattern: [0, 1, 2, 1, 0] },
  { id: 'inverted-v', name: 'Inverted V', pattern: [2, 1, 0, 1, 2] },
  { id: 'diag-down', name: 'Diagonal Down', pattern: [0, 1, 2, 2, 1] },
  { id: 'diag-up', name: 'Diagonal Up', pattern: [2, 1, 0, 0, 1] },
  { id: 'zigzag-high', name: 'High Zigzag', pattern: [0, 1, 0, 1, 0] },
  { id: 'zigzag-low', name: 'Low Zigzag', pattern: [2, 1, 2, 1, 2] },
] as const;
