import type { GraphicsQuality } from '../types';

export interface QualityPreset {
  id: GraphicsQuality;
  pixelRatio: number;
  shadowMapSize: number;
  shadows: boolean;
  softShadows: boolean;
  terrainSegs: number;
  mountainSegs: number;
  treeNear: number;
  treeFar: number;
  propDetail: boolean;
  transmission: boolean;
  envMap: boolean;
  particles: number;
  shards: number;
  smoke: number;
  dust: boolean;
  clouds: number;
  exposure: number;
  anisotropy: number;
}

const clampRatio = (max: number): number => {
  if (typeof window === 'undefined') return Math.min(1.5, max);
  return Math.min(window.devicePixelRatio || 1, max);
};

export const QUALITY_PRESETS: Record<GraphicsQuality, QualityPreset> = {
  low: {
    id: 'low',
    pixelRatio: 1,
    shadowMapSize: 512,
    shadows: false,
    softShadows: false,
    terrainSegs: 36,
    mountainSegs: 18,
    treeNear: 4,
    treeFar: 10,
    propDetail: false,
    transmission: false,
    envMap: false,
    particles: 80,
    shards: 120,
    smoke: 16,
    dust: false,
    clouds: 3,
    exposure: 1.05,
    anisotropy: 2,
  },
  medium: {
    id: 'medium',
    pixelRatio: clampRatio(1.25),
    shadowMapSize: 1024,
    shadows: true,
    softShadows: false,
    terrainSegs: 56,
    mountainSegs: 28,
    treeNear: 7,
    treeFar: 18,
    propDetail: true,
    transmission: false,
    envMap: true,
    particles: 140,
    shards: 180,
    smoke: 24,
    dust: true,
    clouds: 5,
    exposure: 1.08,
    anisotropy: 4,
  },
  high: {
    id: 'high',
    pixelRatio: clampRatio(1.6),
    shadowMapSize: 2048,
    shadows: true,
    softShadows: true,
    terrainSegs: 80,
    mountainSegs: 40,
    treeNear: 10,
    treeFar: 28,
    propDetail: true,
    transmission: true,
    envMap: true,
    particles: 220,
    shards: 280,
    smoke: 36,
    dust: true,
    clouds: 7,
    exposure: 1.1,
    anisotropy: 8,
  },
  ultra: {
    id: 'ultra',
    pixelRatio: clampRatio(2),
    shadowMapSize: 2048,
    shadows: true,
    softShadows: true,
    terrainSegs: 110,
    mountainSegs: 56,
    treeNear: 14,
    treeFar: 40,
    propDetail: true,
    transmission: true,
    envMap: true,
    particles: 280,
    shards: 320,
    smoke: 44,
    dust: true,
    clouds: 9,
    exposure: 1.12,
    anisotropy: 8,
  },
};

export function detectDefaultQuality(): GraphicsQuality {
  if (typeof window === 'undefined') return 'high';
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = window.innerWidth < 820 || window.innerHeight < 520;
  const cores = navigator.hardwareConcurrency || 4;
  if (coarse || small || cores <= 4) return 'medium';
  return 'high';
}

export function getPreset(quality: GraphicsQuality): QualityPreset {
  return QUALITY_PRESETS[quality] ?? QUALITY_PRESETS.high;
}
