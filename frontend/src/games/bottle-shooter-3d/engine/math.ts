export function hash2(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function valueNoise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const n00 = hash2(ix, iy);
  const n10 = hash2(ix + 1, iy);
  const n01 = hash2(ix, iy + 1);
  const n11 = hash2(ix + 1, iy + 1);
  return n00 * (1 - ux) * (1 - uy) + n10 * ux * (1 - uy) + n01 * (1 - ux) * uy + n11 * ux * uy;
}

export function fbm(x: number, y: number, octaves = 5): number {
  let value = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    value += valueNoise2D(x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return value / norm;
}

export function hashNoise(t: number): number {
  const i = Math.floor(t);
  const f = t - i;
  const va = (Math.sin(i * 127.1 + i * 311.7) * 43758.5453) % 1;
  const vb = (Math.sin((i + 1) * 127.1 + (i + 1) * 311.7) * 43758.5453) % 1;
  const u = f * f * (3 - 2 * f);
  return (Math.abs(va) * (1 - u) + Math.abs(vb) * u) * 2 - 1;
}
