export function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const n = Number.parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return [91, 80, 255];
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

export interface CoilParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}

export interface FloatScore {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

export const SNACK_KINDS = new Set(['apple', 'orange', 'berry', 'banana', 'burger', 'pizza', 'fries', 'soda']);

export function drawFoodIcon(
  ctx: CanvasRenderingContext2D,
  kind: string | undefined,
  x: number,
  y: number,
  r: number,
  color: string,
  pulse: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.fillStyle = rgba(color, 0.2);
  ctx.arc(0, 0, r + 5 + pulse, 0, Math.PI * 2);
  ctx.fill();

  if (kind === 'apple') drawApple(ctx, r);
  else if (kind === 'orange') drawOrange(ctx, r);
  else if (kind === 'berry') drawBerry(ctx, r);
  else if (kind === 'banana') drawBanana(ctx, r);
  else if (kind === 'burger') drawBurger(ctx, r);
  else if (kind === 'pizza') drawPizza(ctx, r);
  else if (kind === 'fries') drawFries(ctx, r);
  else if (kind === 'soda') drawSoda(ctx, r);
  else {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.58)';
    ctx.arc(-r * 0.25, -r * 0.28, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawApple(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.fillStyle = '#dc2626';
  ctx.ellipse(0, 1, r * 0.92, r * 0.98, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = '#16a34a';
  ctx.ellipse(r * 0.28, -r * 0.72, r * 0.38, r * 0.18, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = Math.max(1.2, r * 0.16);
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.7);
  ctx.lineTo(0, -r * 1.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.ellipse(-r * 0.28, -r * 0.12, r * 0.18, r * 0.28, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawOrange(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.fillStyle = '#f97316';
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(154, 52, 18, 0.28)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos((i * Math.PI * 2) / 5) * r, Math.sin((i * Math.PI * 2) / 5) * r);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.fillStyle = '#16a34a';
  ctx.arc(0, -r * 0.72, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBerry(ctx: CanvasRenderingContext2D, r: number) {
  const dots: Array<[number, number, string]> = [
    [0, -0.15, '#7e22ce'],
    [-0.42, 0.22, '#a855f7'],
    [0.42, 0.22, '#c084fc'],
  ];
  for (const [dx, dy, fill] of dots) {
    ctx.beginPath();
    ctx.fillStyle = fill;
    ctx.arc(dx * r, dy * r, r * 0.48, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.fillStyle = '#4ade80';
  ctx.moveTo(0, -r * 0.85);
  ctx.lineTo(-r * 0.28, -r * 0.35);
  ctx.lineTo(r * 0.28, -r * 0.35);
  ctx.fill();
}

function drawBanana(ctx: CanvasRenderingContext2D, r: number) {
  ctx.strokeStyle = '#eab308';
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.72;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0.35, 2.55);
  ctx.stroke();
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = r * 0.46;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0.4, 2.5);
  ctx.stroke();
  ctx.fillStyle = '#854d0e';
  ctx.beginPath();
  ctx.arc(Math.cos(0.35) * r * 0.78, Math.sin(0.35) * r * 0.78, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

function drawBurger(ctx: CanvasRenderingContext2D, r: number) {
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.28, r * 0.95, r * 0.42, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(-r * 0.88, -r * 0.12, r * 1.76, r * 0.18);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(-r * 0.9, 0.04 * r, r * 1.8, r * 0.28);
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.42, r * 0.92, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPizza(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.85, r * 0.75);
  ctx.lineTo(-r * 0.85, r * 0.75);
  ctx.closePath();
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.62);
  ctx.lineTo(r * 0.58, r * 0.5);
  ctx.lineTo(-r * 0.58, r * 0.5);
  ctx.closePath();
  ctx.fillStyle = '#fde68a';
  ctx.fill();
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(-r * 0.12, -0.05 * r, r * 0.16, 0, Math.PI * 2);
  ctx.arc(r * 0.22, r * 0.22, r * 0.14, 0, Math.PI * 2);
  ctx.arc(-r * 0.2, r * 0.32, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawFries(ctx: CanvasRenderingContext2D, r: number) {
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, r * 0.15);
  ctx.lineTo(-r * 0.55, r * 0.85);
  ctx.lineTo(r * 0.55, r * 0.85);
  ctx.lineTo(r * 0.7, r * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#facc15';
  for (const x of [-0.38, -0.08, 0.22, 0.48]) {
    ctx.fillRect(x * r, -r * 0.85, r * 0.18, r * 1.05);
  }
}

function drawSoda(ctx: CanvasRenderingContext2D, r: number) {
  ctx.fillStyle = '#e11d48';
  ctx.beginPath();
  ctx.moveTo(-r * 0.42, -r * 0.35);
  ctx.lineTo(-r * 0.5, r * 0.82);
  ctx.lineTo(r * 0.5, r * 0.82);
  ctx.lineTo(r * 0.42, -r * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fda4af';
  ctx.fillRect(-r * 0.38, -r * 0.55, r * 0.76, r * 0.24);
  ctx.fillStyle = '#fff';
  ctx.fillRect(-r * 0.08, -r * 0.95, r * 0.16, r * 0.42);
  ctx.beginPath();
  ctx.arc(r * 0.18, -r * 0.88, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

export function spawnBurst(pool: CoilParticle[], x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const dead = pool.find((p) => p.life <= 0);
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.6 + Math.random() * 2.4;
    const next: CoilParticle = dead || { x, y, vx: 0, vy: 0, life: 0, max: 1, color, size: 2 };
    next.x = x;
    next.y = y;
    next.vx = Math.cos(angle) * speed;
    next.vy = Math.sin(angle) * speed;
    next.life = 1;
    next.max = 0.35 + Math.random() * 0.45;
    next.color = color;
    next.size = 1.4 + Math.random() * 2.6;
    if (!dead && pool.length < 120) pool.push(next);
  }
}
