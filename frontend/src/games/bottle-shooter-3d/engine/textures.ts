import * as THREE from 'three';
import { fbm, hash2 } from './math';
import type { QualityPreset } from './quality';
import type { BottleKind } from '../types';

function canvas(size: number): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D canvas unavailable');
  return { c, ctx };
}

function toMap(c: HTMLCanvasElement, repeat = 1, anisotropy = 4, linear = false): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  t.needsUpdate = true;
  return t;
}

function heightToNormal(src: ImageData, strength = 1.8): ImageData {
  const { width: w, height: h, data } = src;
  const out = new ImageData(w, h);
  const at = (x: number, y: number) => {
    const i = ((y + h) % h) * w + ((x + w) % w);
    return data[i * 4] / 255;
  };
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const nx = -dx;
      const ny = -dy;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      const i = (y * w + x) * 4;
      out.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      out.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      out.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  }
  return out;
}

function woodPair(size: number, aniso: number): { map: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#6b4426';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 1) {
    const wave = Math.sin(y * 0.055) * 10 + Math.sin(y * 0.017) * 18;
    const shade = 92 + Math.sin(y * 0.09) * 16 + hash2(y, 3) * 18;
    ctx.fillStyle = `rgb(${shade + 38 | 0},${shade - 8 | 0},${shade - 36 | 0})`;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(0, y, size, 1);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = `rgba(40,22,10,${0.12 + hash2(y, 9) * 0.2})`;
    ctx.fillRect(wave, y, size * 0.35, 1);
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 10; i += 1) {
    const cy = hash2(i, 2) * size;
    const cx = hash2(i, 7) * size;
    ctx.strokeStyle = `rgba(48,26,12,${0.28 + hash2(i, 4) * 0.25})`;
    ctx.lineWidth = 1.2 + hash2(i, 5) * 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 10 + hash2(i, 1) * 16, 5 + hash2(i, 8) * 6, hash2(i, 6), 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 40; i += 1) {
    ctx.fillStyle = `rgba(30,16,8,${0.08 + hash2(i, 11) * 0.16})`;
    ctx.fillRect(hash2(i, 12) * size, hash2(i, 13) * size, 8 + hash2(i, 14) * 28, 1 + hash2(i, 15) * 2);
  }
  const height = ctx.getImageData(0, 0, size, size);
  const map = toMap(c, 2, aniso);
  const { c: nc, ctx: nctx } = canvas(size);
  nctx.putImageData(heightToNormal(height, 2.4), 0, 0);
  return { map, normal: toMap(nc, 2, aniso, true) };
}

function dirtPair(size: number, aniso: number): { map: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#6a5a42';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 22; i += 1) {
    const x = hash2(i, 1) * size;
    const y = hash2(i, 2) * size;
    const v = 78 + hash2(i, 3) * 70;
    ctx.fillStyle = `rgba(${v | 0},${v - 14 | 0},${v - 28 | 0},${0.18 + hash2(i, 4) * 0.28})`;
    ctx.fillRect(x, y, 1 + hash2(i, 5) * 4, 1 + hash2(i, 6) * 3);
  }
  for (let i = 0; i < 90; i += 1) {
    ctx.fillStyle = `rgba(40,34,26,${0.08 + hash2(i, 20) * 0.14})`;
    ctx.beginPath();
    ctx.ellipse(hash2(i, 21) * size, hash2(i, 22) * size, 16 + hash2(i, 23) * 40, 6 + hash2(i, 24) * 14, hash2(i, 25), 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 220; i += 1) {
    const g = 90 + hash2(i, 30) * 80;
    ctx.fillStyle = `rgb(${g | 0},${g - 12 | 0},${g - 24 | 0})`;
    ctx.beginPath();
    ctx.arc(hash2(i, 31) * size, hash2(i, 32) * size, 0.6 + hash2(i, 33) * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  const height = ctx.getImageData(0, 0, size, size);
  const map = toMap(c, 10, aniso);
  const { c: nc, ctx: nctx } = canvas(size);
  nctx.putImageData(heightToNormal(height, 3.1), 0, 0);
  return { map, normal: toMap(nc, 10, aniso, true) };
}

function gravelPair(size: number, aniso: number): { map: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#7a7368';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 14; i += 1) {
    const g = 95 + hash2(i, 1) * 70;
    ctx.fillStyle = `rgba(${g | 0},${g - 8 | 0},${g - 16 | 0},${0.35 + hash2(i, 2) * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(hash2(i, 3) * size, hash2(i, 4) * size, 1.2 + hash2(i, 5) * 3.5, 0.8 + hash2(i, 6) * 2.2, hash2(i, 7), 0, Math.PI * 2);
    ctx.fill();
  }
  const height = ctx.getImageData(0, 0, size, size);
  const map = toMap(c, 8, aniso);
  const { c: nc, ctx: nctx } = canvas(size);
  nctx.putImageData(heightToNormal(height, 2.6), 0, 0);
  return { map, normal: toMap(nc, 8, aniso, true) };
}

function rockPair(size: number, aniso: number): { map: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
  const { c, ctx } = canvas(size);
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const n = fbm(x * 0.02, y * 0.02, 4);
      const v = 92 + n * 70;
      ctx.fillStyle = `rgb(${v | 0},${v - 10 | 0},${v - 20 | 0})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const height = ctx.getImageData(0, 0, size, size);
  const map = toMap(c, 4, aniso);
  const { c: nc, ctx: nctx } = canvas(size);
  nctx.putImageData(heightToNormal(height, 2.8), 0, 0);
  return { map, normal: toMap(nc, 4, aniso, true) };
}

function barkMap(size: number, aniso: number): THREE.CanvasTexture {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#3d2a1c';
  ctx.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x += 3) {
    const shade = 48 + hash2(x, 1) * 36;
    ctx.fillStyle = `rgba(${shade + 20 | 0},${shade | 0},${shade - 10 | 0},0.7)`;
    ctx.fillRect(x, 0, 2 + hash2(x, 2) * 2, size);
  }
  for (let i = 0; i < 80; i += 1) {
    ctx.fillStyle = `rgba(20,12,8,${0.15 + hash2(i, 4) * 0.25})`;
    ctx.fillRect(hash2(i, 5) * size, hash2(i, 6) * size, 2, 8 + hash2(i, 7) * 18);
  }
  return toMap(c, 1, aniso);
}

function metalMap(size: number, aniso: number): THREE.CanvasTexture {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#2a2d32';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 8; i += 1) {
    const v = 50 + hash2(i, 1) * 40;
    ctx.fillStyle = `rgba(${v | 0},${v + 2 | 0},${v + 6 | 0},${0.08 + hash2(i, 2) * 0.12})`;
    ctx.fillRect(hash2(i, 3) * size, hash2(i, 4) * size, 8 + hash2(i, 5) * 40, 1);
  }
  return toMap(c, 2, aniso);
}

function gripMap(size: number, aniso: number): THREE.CanvasTexture {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#121214';
  ctx.fillRect(0, 0, size, size);
  const cell = 6;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      ctx.fillStyle = hash2(x, y) > 0.5 ? '#1a1a1d' : '#0e0e10';
      ctx.fillRect(x, y, cell - 1, cell - 1);
    }
  }
  return toMap(c, 4, aniso);
}

function leatherMap(size: number, aniso: number): THREE.CanvasTexture {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#5a4632';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 10; i += 1) {
    const v = 70 + hash2(i, 1) * 50;
    ctx.fillStyle = `rgba(${v + 20 | 0},${v - 6 | 0},${v - 24 | 0},${0.12 + hash2(i, 2) * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(hash2(i, 3) * size, hash2(i, 4) * size, 2 + hash2(i, 5) * 6, 1 + hash2(i, 6) * 3, hash2(i, 7), 0, Math.PI * 2);
    ctx.fill();
  }
  return toMap(c, 2, aniso);
}

function cloudMap(size: number): THREE.CanvasTexture {
  const { c, ctx } = canvas(size);
  ctx.clearRect(0, 0, size, size);
  for (let i = 0; i < 18; i += 1) {
    const cx = hash2(i, 1) * size;
    const cy = 0.28 * size + hash2(i, 2) * 0.4 * size;
    const rx = 40 + hash2(i, 3) * 90;
    const ry = 16 + hash2(i, 4) * 28;
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, rx);
    g.addColorStop(0, 'rgba(255,255,255,0.78)');
    g.addColorStop(0.55, 'rgba(244,248,252,0.32)');
    g.addColorStop(1, 'rgba(244,248,252,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function flashMap(): THREE.CanvasTexture {
  const { c, ctx } = canvas(128);
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,252,230,1)');
  g.addColorStop(0.18, 'rgba(255,210,110,0.9)');
  g.addColorStop(0.45, 'rgba(255,140,40,0.35)');
  g.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = 'rgba(255,240,180,0.85)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(64 + Math.cos(a) * 8, 64 + Math.sin(a) * 8);
    ctx.lineTo(64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function crackMap(): THREE.CanvasTexture {
  const { c, ctx } = canvas(256);
  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(230,240,255,0.85)';
  ctx.lineWidth = 1.4;
  const drawCrack = (x: number, y: number, a: number, len: number, depth: number) => {
    if (depth <= 0 || len < 8) return;
    const nx = x + Math.cos(a) * len;
    const ny = y + Math.sin(a) * len;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    drawCrack(nx, ny, a + 0.5, len * 0.55, depth - 1);
    drawCrack(nx, ny, a - 0.6, len * 0.5, depth - 1);
  };
  drawCrack(128, 128, -1.2, 70, 4);
  drawCrack(128, 128, 0.4, 62, 4);
  drawCrack(128, 128, 2.3, 54, 3);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const LABEL_META: Record<BottleKind, { title: string; sub: string; paper: string; ink: string; accent: string }> = {
  normal: { title: 'PINE RIDGE', sub: 'LAGER', paper: '#efe4c8', ink: '#3a2a18', accent: '#2f6a44' },
  heavy: { title: 'IRON CASK', sub: 'STOUT', paper: '#e6d3b0', ink: '#2a1810', accent: '#6b3418' },
  moving: { title: 'NORTH BAY', sub: 'CIDER', paper: '#e8eef4', ink: '#1a3048', accent: '#2a6a96' },
  spinning: { title: 'WIND MILL', sub: 'PILS', paper: '#e4f0ea', ink: '#16382e', accent: '#1f7a68' },
  bonus: { title: 'NIGHTCAP', sub: 'RESERVE', paper: '#efe6f4', ink: '#2a1638', accent: '#7a3d9b' },
  gold: { title: 'GILDED', sub: 'LIMITED', paper: '#f7ebc4', ink: '#3a2a08', accent: '#c4921a' },
};

function labelMap(kind: BottleKind): THREE.CanvasTexture {
  const { c, ctx } = canvas(256);
  const meta = LABEL_META[kind];
  ctx.fillStyle = meta.paper;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = meta.accent;
  ctx.fillRect(0, 0, 256, 18);
  ctx.fillRect(0, 238, 256, 18);
  ctx.strokeStyle = meta.ink;
  ctx.globalAlpha = 0.35;
  ctx.strokeRect(14, 28, 228, 200);
  ctx.globalAlpha = 1;
  ctx.fillStyle = meta.ink;
  ctx.font = '700 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(meta.title, 128, 118);
  ctx.font = '600 16px Georgia, serif';
  ctx.fillText(meta.sub, 128, 148);
  ctx.strokeStyle = meta.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 162);
  ctx.lineTo(186, 162);
  ctx.stroke();
  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = `${meta.ink}99`;
  ctx.fillText('EST. 1924  ·  RANGE SERIES', 128, 190);
  return toMap(c, 1, 4);
}

export interface TextureKit {
  wood: THREE.CanvasTexture;
  woodNormal: THREE.CanvasTexture;
  dirt: THREE.CanvasTexture;
  dirtNormal: THREE.CanvasTexture;
  gravel: THREE.CanvasTexture;
  gravelNormal: THREE.CanvasTexture;
  rock: THREE.CanvasTexture;
  rockNormal: THREE.CanvasTexture;
  bark: THREE.CanvasTexture;
  metal: THREE.CanvasTexture;
  grip: THREE.CanvasTexture;
  leather: THREE.CanvasTexture;
  cloud: THREE.CanvasTexture;
  flash: THREE.CanvasTexture;
  crack: THREE.CanvasTexture;
  labels: Record<BottleKind, THREE.CanvasTexture>;
  dispose: () => void;
}

export function createTextures(quality: QualityPreset): TextureKit {
  const aniso = quality.anisotropy;
  const hi = quality.id === 'ultra' || quality.id === 'high' ? 512 : 256;
  const wood = woodPair(hi, aniso);
  const dirt = dirtPair(hi, aniso);
  const gravel = gravelPair(hi, aniso);
  const rock = rockPair(hi, aniso);
  const labels = {
    normal: labelMap('normal'),
    heavy: labelMap('heavy'),
    moving: labelMap('moving'),
    spinning: labelMap('spinning'),
    bonus: labelMap('bonus'),
    gold: labelMap('gold'),
  };
  const kit: TextureKit = {
    wood: wood.map,
    woodNormal: wood.normal,
    dirt: dirt.map,
    dirtNormal: dirt.normal,
    gravel: gravel.map,
    gravelNormal: gravel.normal,
    rock: rock.map,
    rockNormal: rock.normal,
    bark: barkMap(256, aniso),
    metal: metalMap(256, aniso),
    grip: gripMap(256, aniso),
    leather: leatherMap(256, aniso),
    cloud: cloudMap(512),
    flash: flashMap(),
    crack: crackMap(),
    labels,
    dispose() {
      Object.values(this).forEach((value) => {
        if (value && typeof value === 'object' && 'dispose' in value && typeof value.dispose === 'function') {
          value.dispose();
        }
      });
      Object.values(this.labels).forEach((t) => t.dispose());
    },
  };
  return kit;
}
