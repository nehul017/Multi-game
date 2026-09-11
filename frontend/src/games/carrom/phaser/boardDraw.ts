const SIZE = 1024;
const VIEW = 900;
const FRAME = Math.round((92 / VIEW) * SIZE);
const PLAY = SIZE - FRAME * 2;
const BOARD = 1000;

const toPlay = (board: number): number => FRAME + (board / BOARD) * PLAY;
const unit = (board: number): number => (board / BOARD) * PLAY;

const hash = (x: number, y: number): number => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

const grain = (x: number, y: number, scale: number): number => {
  const u = x * scale;
  const v = y * scale;
  return (
    hash(Math.floor(u), Math.floor(v)) * 0.55 +
    hash(Math.floor(u * 2.1), Math.floor(v * 1.7)) * 0.3 +
    hash(Math.floor(u * 5.3), Math.floor(v * 3.9)) * 0.15
  );
};

const hexRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

const fillWood = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  dark: string,
  light: string
): void => {
  const [dr, dg, db] = hexRgb(dark);
  const [lr, lg, lb] = hexRgb(light);
  const image = ctx.createImageData(w, h);
  const data = image.data;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const gx = x + px;
      const gy = y + py;
      const n = grain(gx, gy, 0.034);
      const rings = 0.5 + 0.5 * Math.sin(gy * 0.09 + n * 5.4);
      const streak = 0.5 + 0.5 * Math.sin(gx * 0.011 + n * 2.8);
      const t = Math.min(1, Math.max(0, n * 0.4 + rings * 0.42 + streak * 0.18));
      const i = (py * w + px) * 4;
      data[i] = Math.round(dr + (lr - dr) * t);
      data[i + 1] = Math.round(dg + (lg - dg) * t);
      data[i + 2] = Math.round(db + (lb - db) * t);
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, x, y);
};

const fillSurface = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void => {
  ctx.fillStyle = '#f6eed8';
  ctx.fillRect(x, y, w, h);

  const image = ctx.createImageData(w, h);
  const data = image.data;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const n = grain(x + px, y + py, 0.06);
      const plank = 0.5 + 0.5 * Math.sin((x + px) * 0.012 + n * 1.4);
      const shade = 0.97 + n * 0.05 + plank * 0.025;
      const i = (py * w + px) * 4;
      data[i] = Math.min(255, Math.round(246 * shade));
      data[i + 1] = Math.min(255, Math.round(238 * shade));
      data[i + 2] = Math.min(255, Math.round(216 * shade));
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, x, y);
};

const star = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outer: number,
  inner: number
): void => {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
};

const drawSphere = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  colors: [string, string, string]
): void => {
  const g = ctx.createRadialGradient(x - r * 0.32, y - r * 0.38, r * 0.08, x, y, r);
  g.addColorStop(0, colors[0]);
  g.addColorStop(0.55, colors[1]);
  g.addColorStop(1, colors[2]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.28, y - r * 0.32, r * 0.28, r * 0.16, -0.55, 0, Math.PI * 2);
  ctx.fill();
};

const drawPocket = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void => {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#24160e';
  ctx.beginPath();
  ctx.arc(x, y, r + 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const rim = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.35, x, y, r + 5.5);
  rim.addColorStop(0, '#5a3820');
  rim.addColorStop(0.7, '#2c1810');
  rim.addColorStop(1, '#140c08');
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(x, y, r + 5.5, 0, Math.PI * 2);
  ctx.fill();

  const hole = ctx.createRadialGradient(x - r * 0.2, y - r * 0.22, r * 0.04, x, y, r);
  hole.addColorStop(0, '#221818');
  hole.addColorStop(0.22, '#0c0809');
  hole.addColorStop(0.7, '#050306');
  hole.addColorStop(1, '#000000');
  ctx.fillStyle = hole;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
};

const drawArrow = (
  ctx: CanvasRenderingContext2D,
  fromA: [number, number],
  fromB: [number, number],
  pocket: [number, number]
): void => {
  const tipDist = unit(62);
  const lenA = Math.hypot(fromA[0] - pocket[0], fromA[1] - pocket[1]) || 1;
  const lenB = Math.hypot(fromB[0] - pocket[0], fromB[1] - pocket[1]) || 1;
  const ax = pocket[0] + ((fromA[0] - pocket[0]) / lenA) * tipDist;
  const ay = pocket[1] + ((fromA[1] - pocket[1]) / lenA) * tipDist;
  const bx = pocket[0] + ((fromB[0] - pocket[0]) / lenB) * tipDist;
  const by = pocket[1] + ((fromB[1] - pocket[1]) / lenB) * tipDist;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const vx = pocket[0] - mx;
  const vy = pocket[1] - my;
  const len = Math.hypot(vx, vy) || 1;
  const tip: [number, number] = [mx + (vx / len) * unit(16), my + (vy / len) * unit(16)];

  ctx.beginPath();
  ctx.moveTo(fromA[0], fromA[1]);
  ctx.lineTo(ax, ay);
  ctx.moveTo(fromB[0], fromB[1]);
  ctx.lineTo(bx, by);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(tip[0], tip[1]);
  ctx.lineTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.closePath();
  ctx.stroke();
};

const drawCenterRose = (ctx: CanvasRenderingContext2D, cx: number, cy: number): void => {
  const outer = unit(120);
  const mid = unit(80);
  const inner = unit(27);

  ctx.strokeStyle = 'rgba(96, 56, 28, 0.55)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, outer, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, mid, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(110, 64, 32, 0.42)';
  ctx.lineWidth = 1.2;
  const petals = 16;
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / petals);
    ctx.beginPath();
    ctx.moveTo(inner * 0.6, 0);
    ctx.quadraticCurveTo(unit(54), unit(15), outer * 0.92, 0);
    ctx.quadraticCurveTo(unit(54), -unit(15), inner * 0.6, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.strokeStyle = '#c81e14';
  ctx.lineWidth = 2.8;
  ctx.stroke();
};

export const drawCarromBoard = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  fillWood(ctx, 0, 0, SIZE, SIZE, '#1a0e08', '#6b4226');

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#2a1810';
  ctx.beginPath();
  roundedRect(ctx, 14, 14, SIZE - 28, SIZE - 28, 26);
  ctx.fill();
  ctx.restore();

  fillWood(ctx, 16, 16, SIZE - 32, SIZE - 32, '#27150c', '#8a5530');

  ctx.save();
  ctx.shadowColor = 'rgba(40, 22, 10, 0.28)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#f4ead0';
  ctx.fillRect(FRAME, FRAME, PLAY, PLAY);
  ctx.restore();
  fillSurface(ctx, FRAME, FRAME, PLAY, PLAY);

  const lip = ctx.createLinearGradient(0, FRAME - 12, 0, FRAME + 6);
  lip.addColorStop(0, 'rgba(255, 214, 160, 0.2)');
  lip.addColorStop(0.55, 'rgba(90, 50, 24, 0.35)');
  lip.addColorStop(1, 'rgba(40, 20, 10, 0.12)');
  ctx.fillStyle = lip;
  ctx.fillRect(FRAME - 8, FRAME - 8, PLAY + 16, 8);
  ctx.fillRect(FRAME - 8, FRAME + PLAY, PLAY + 16, 8);
  const lipL = ctx.createLinearGradient(FRAME - 12, 0, FRAME + 6, 0);
  lipL.addColorStop(0, 'rgba(255, 214, 160, 0.2)');
  lipL.addColorStop(0.55, 'rgba(90, 50, 24, 0.35)');
  lipL.addColorStop(1, 'rgba(40, 20, 10, 0.12)');
  ctx.fillStyle = lipL;
  ctx.fillRect(FRAME - 8, FRAME, 8, PLAY);
  const lipR = ctx.createLinearGradient(FRAME + PLAY + 12, 0, FRAME + PLAY - 6, 0);
  lipR.addColorStop(0, 'rgba(255, 214, 160, 0.2)');
  lipR.addColorStop(0.55, 'rgba(90, 50, 24, 0.35)');
  lipR.addColorStop(1, 'rgba(40, 20, 10, 0.12)');
  ctx.fillStyle = lipR;
  ctx.fillRect(FRAME + PLAY, FRAME, 8, PLAY);

  const wash = ctx.createRadialGradient(SIZE / 2, SIZE / 2, unit(50), SIZE / 2, SIZE / 2, PLAY * 0.7);
  wash.addColorStop(0, 'rgba(255, 252, 240, 0.28)');
  wash.addColorStop(0.6, 'rgba(255, 244, 214, 0.04)');
  wash.addColorStop(1, 'rgba(120, 80, 40, 0.08)');
  ctx.fillStyle = wash;
  ctx.fillRect(FRAME, FRAME, PLAY, PLAY);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const outerLine = 102;
  const innerLine = 134;
  const lineMin = 168;
  const lineMax = 832;
  const o = unit(outerLine);
  const inn = unit(innerLine);
  const a0 = toPlay(lineMin);
  const a1 = toPlay(lineMax);

  ctx.strokeStyle = 'rgba(92, 52, 26, 0.62)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(a0, FRAME + o);
  ctx.lineTo(a1, FRAME + o);
  ctx.moveTo(a0, FRAME + inn);
  ctx.lineTo(a1, FRAME + inn);
  ctx.moveTo(a0, FRAME + PLAY - o);
  ctx.lineTo(a1, FRAME + PLAY - o);
  ctx.moveTo(a0, FRAME + PLAY - inn);
  ctx.lineTo(a1, FRAME + PLAY - inn);
  ctx.moveTo(FRAME + o, a0);
  ctx.lineTo(FRAME + o, a1);
  ctx.moveTo(FRAME + inn, a0);
  ctx.lineTo(FRAME + inn, a1);
  ctx.moveTo(FRAME + PLAY - o, a0);
  ctx.lineTo(FRAME + PLAY - o, a1);
  ctx.moveTo(FRAME + PLAY - inn, a0);
  ctx.lineTo(FRAME + PLAY - inn, a1);
  ctx.stroke();

  const diamondPad = toPlay(innerLine);
  ctx.beginPath();
  ctx.moveTo(cx, diamondPad);
  ctx.lineTo(SIZE - diamondPad, cy);
  ctx.lineTo(cx, SIZE - diamondPad);
  ctx.lineTo(diamondPad, cy);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(92, 52, 26, 0.5)';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  drawCenterRose(ctx, cx, cy);

  const pockets: Array<[number, number]> = [
    [toPlay(10), toPlay(10)],
    [toPlay(990), toPlay(10)],
    [toPlay(990), toPlay(990)],
    [toPlay(10), toPlay(990)],
  ];
  const pocketR = unit(41);
  const endY = FRAME + (o + inn) / 2;
  const endX = FRAME + (o + inn) / 2;
  ctx.strokeStyle = 'rgba(92, 52, 26, 0.55)';
  ctx.lineWidth = 1.7;
  drawArrow(ctx, [a0, endY], [endX, a0], pockets[0]);
  drawArrow(ctx, [a1, endY], [SIZE - endX, a0], pockets[1]);
  drawArrow(ctx, [a1, SIZE - endY], [SIZE - endX, a1], pockets[2]);
  drawArrow(ctx, [a0, SIZE - endY], [endX, a1], pockets[3]);

  const beads: Array<[number, number]> = [
    [cx, diamondPad],
    [SIZE - diamondPad, cy],
    [cx, SIZE - diamondPad],
    [diamondPad, cy],
    [a0, endY],
    [a1, endY],
    [a0, SIZE - endY],
    [a1, SIZE - endY],
    [endX, a0],
    [endX, a1],
    [SIZE - endX, a0],
    [SIZE - endX, a1],
  ];
  for (const [bx, by] of beads) {
    drawSphere(ctx, bx, by, 7.2, ['#ff7a6a', '#d32218', '#7a100c']);
  }

  for (const [px, py] of pockets) {
    drawPocket(ctx, px, py, pocketR);
  }

  ctx.strokeStyle = 'rgba(255, 220, 170, 0.18)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  roundedRect(ctx, 12, 12, SIZE - 24, SIZE - 24, 28);
  ctx.stroke();

  return canvas;
};

export const drawPieceTexture = (kind: 'white' | 'black' | 'queen' | 'striker'): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const cx = 64;
  const cy = 62;
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = 'rgba(0,0,0,0.26)';
  ctx.beginPath();
  ctx.ellipse(cx + 2, 80, 36, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  const palette: [string, string, string] =
    kind === 'black'
      ? ['#5a5a60', '#1c1c20', '#09090b']
      : kind === 'queen'
        ? ['#ff7d70', '#d21c14', '#7a0d0c']
        : ['#fffdf8', '#f0e6d4', '#c8b59a'];

  const body = ctx.createRadialGradient(cx - 14, cy - 16, 6, cx, cy, 42);
  body.addColorStop(0, palette[0]);
  body.addColorStop(0.55, palette[1]);
  body.addColorStop(1, palette[2]);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = kind === 'black' ? 'rgba(255,255,255,0.12)' : 'rgba(80,50,20,0.2)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 27, 0, Math.PI * 2);
  ctx.strokeStyle = kind === 'queen' ? 'rgba(255,220,180,0.4)' : 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (kind === 'striker') {
    ctx.save();
    ctx.shadowColor = '#3ea7ff';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#2f8dff';
    star(ctx, cx, cy, 8, 20, 8);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.4;
    star(ctx, cx, cy, 8, 20, 8);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx - 12, cy - 16, 14, 7, -0.6, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
};
