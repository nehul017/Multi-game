export function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const n = Number.parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return [46, 196, 182];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function mix(hex: string, toward: string, amount: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(toward);
  const t = Math.max(0, Math.min(1, amount));
  const ch = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `rgb(${ch(0)},${ch(1)},${ch(2)})`;
}

export const BOT_NAMES: Record<string, string> = {
  random: 'Drift',
  aggressive: 'Ember',
  defensive: 'Tide',
  hunter: 'Viper',
  beginner: 'Spark',
  advanced: 'Nova',
  boss: 'Titan',
};
