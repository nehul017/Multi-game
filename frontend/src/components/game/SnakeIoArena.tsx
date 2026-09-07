'use client';

import { useCallback, useEffect, useRef } from 'react';

export interface SnakeSteerInput {
  angle: number;
  boost: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface Food {
  x: number;
  y: number;
  value?: number;
  color?: string;
  r?: number;
}

interface Snake {
  playerId: string;
  body: Point[];
  angle?: number;
  targetAngle?: number;
  boosting?: boolean;
  alive: boolean;
  score: number;
  kills?: number;
  color: string;
  radius?: number;
}

interface IoBoard {
  mode?: string;
  worldSize?: number;
  arenaRadius?: number;
  origin?: Point;
  snakes?: Snake[];
  food?: Food[];
}

interface SnakeIoArenaProps {
  board?: unknown;
  currentUserId?: string;
  disabled?: boolean;
  gameStatus?: string;
  onSteer?: (input: SnakeSteerInput) => void;
}

const DEFAULT_WORLD = 2000;
const DEFAULT_RADIUS = 920;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPoint(a: Point | undefined, b: Point | undefined, t: number): Point {
  if (!a && !b) return { x: 0, y: 0 };
  if (!a) return { x: b!.x, y: b!.y };
  if (!b) return { x: a.x, y: a.y };
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function readBoard(board: unknown): IoBoard {
  return (board && typeof board === 'object' ? board : {}) as IoBoard;
}

export function SnakeIoArena({
  board,
  currentUserId,
  disabled,
  gameStatus,
  onSteer,
}: SnakeIoArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<IoBoard>(readBoard(board));
  const prevBoardRef = useRef<IoBoard>(readBoard(board));
  const receivedAtRef = useRef(performance.now());
  const camRef = useRef({ x: 1000, y: 1000, zoom: 1 });
  const pointerRef = useRef({ x: 0, y: 0, inside: false });
  const boostRef = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());
  const onSteerRef = useRef(onSteer);
  const statusRef = useRef(gameStatus);
  const disabledRef = useRef(disabled);
  const userRef = useRef(currentUserId);

  onSteerRef.current = onSteer;
  statusRef.current = gameStatus;
  disabledRef.current = disabled;
  userRef.current = currentUserId;

  useEffect(() => {
    prevBoardRef.current = boardRef.current;
    boardRef.current = readBoard(board);
    receivedAtRef.current = performance.now();
  }, [board]);

  const currentAngle = useCallback(() => {
    const next = boardRef.current;
    const me = next.snakes?.find((s) => s.playerId === userRef.current);
    const head = me?.body?.[0];
    const cam = camRef.current;
    const world = next.worldSize || DEFAULT_WORLD;

    if (pointerRef.current.inside && head) {
      return Math.atan2(pointerRef.current.y - head.y, pointerRef.current.x - head.x);
    }

    const keys = keysRef.current;
    let dx = 0;
    let dy = 0;
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx += 1;
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx -= 1;
    if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dy += 1;
    if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dy -= 1;
    if (dx || dy) return Math.atan2(dy, dx);

    return me?.targetAngle ?? me?.angle ?? 0;
  }, []);

  useEffect(() => {
    const send = () => {
      if (disabledRef.current || statusRef.current !== 'playing') return;
      onSteerRef.current?.({
        angle: currentAngle(),
        boost: boostRef.current,
      });
    };

    send();
    const id = window.setInterval(send, 50);
    return () => window.clearInterval(id);
  }, [currentAngle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const toWorld = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const sx = ((clientX - rect.left) / rect.width) * canvas.width;
      const sy = ((clientY - rect.top) / rect.height) * canvas.height;
      const cam = camRef.current;
      return {
        x: cam.x + (sx - canvas.width / 2) / cam.zoom,
        y: cam.y + (sy - canvas.height / 2) / cam.zoom,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      const world = toWorld(e.clientX, e.clientY);
      pointerRef.current = { ...world, inside: true };
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 0) boostRef.current = true;
      canvas.setPointerCapture(e.pointerId);
      onPointerMove(e);
    };
    const onPointerUp = () => {
      boostRef.current = false;
    };
    const onPointerLeave = () => {
      pointerRef.current.inside = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement | null)?.tagName || '')) return;
      keysRef.current.add(e.key);
      if (e.code === 'Space') {
        e.preventDefault();
        boostRef.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
      if (e.code === 'Space') boostRef.current = false;
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const draw = () => {
      const next = boardRef.current;
      const prev = prevBoardRef.current;
      const world = next.worldSize || DEFAULT_WORLD;
      const radius = next.arenaRadius || DEFAULT_RADIUS;
      const origin = next.origin || { x: world / 2, y: world / 2 };
      const t = Math.min(1, (performance.now() - receivedAtRef.current) / 50);

      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth || 800;
      const cssH = canvas.clientHeight || 520;
      if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
      }

      const meNext = next.snakes?.find((s) => s.playerId === userRef.current);
      const mePrev = prev.snakes?.find((s) => s.playerId === userRef.current);
      const myHead = lerpPoint(mePrev?.body?.[0], meNext?.body?.[0], t);
      const zoom = Math.max(0.72, 1.05 - (meNext?.body?.length || 14) * 0.004);
      camRef.current.x = lerp(camRef.current.x, myHead.x || origin.x, 0.12);
      camRef.current.y = lerp(camRef.current.y, myHead.y || origin.y, 0.12);
      camRef.current.zoom = lerp(camRef.current.zoom, zoom, 0.04);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#070b16';
      ctx.fillRect(0, 0, cssW, cssH);

      ctx.save();
      ctx.translate(cssW / 2, cssH / 2);
      ctx.scale(camRef.current.zoom, camRef.current.zoom);
      ctx.translate(-camRef.current.x, -camRef.current.y);

      ctx.fillStyle = '#0b1220';
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, radius + 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 212, 255, 0.28)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,0.035)';
      ctx.lineWidth = 1;
      for (let x = origin.x - radius; x <= origin.x + radius; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, origin.y - radius);
        ctx.lineTo(x, origin.y + radius);
        ctx.stroke();
      }
      for (let y = origin.y - radius; y <= origin.y + radius; y += 80) {
        ctx.beginPath();
        ctx.moveTo(origin.x - radius, y);
        ctx.lineTo(origin.x + radius, y);
        ctx.stroke();
      }

      for (const pellet of next.food || []) {
        ctx.beginPath();
        ctx.fillStyle = pellet.color || '#00ff88';
        ctx.shadowColor = pellet.color || '#00ff88';
        ctx.shadowBlur = 12;
        ctx.arc(pellet.x, pellet.y, pellet.r || 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      const snakes = next.snakes || [];
      for (const snake of snakes) {
        const older = prev.snakes?.find((s) => s.playerId === snake.playerId);
        const body = snake.body || [];
        if (!body.length) continue;

        for (let i = body.length - 1; i >= 0; i--) {
          const point = lerpPoint(older?.body?.[i], body[i], t);
          const isHead = i === 0;
          const radiusSeg = (snake.radius || 9) * (isHead ? 1.15 : 0.78 + (1 - i / body.length) * 0.22);
          ctx.beginPath();
          ctx.fillStyle = snake.alive ? snake.color : 'rgba(255,255,255,0.18)';
          ctx.globalAlpha = snake.alive ? 1 : 0.35;
          ctx.shadowColor = snake.color;
          ctx.shadowBlur = isHead ? 18 : 6;
          ctx.arc(point.x, point.y, radiusSeg, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        const head = lerpPoint(older?.body?.[0], body[0], t);
        const angle =
          snake.playerId === userRef.current && statusRef.current === 'playing'
            ? currentAngle()
            : snake.angle ?? 0;
        if (snake.alive) {
          ctx.save();
          ctx.translate(head.x, head.y);
          ctx.rotate(angle);
          ctx.fillStyle = '#0b1020';
          ctx.beginPath();
          ctx.arc(6, -3.4, 2.1, 0, Math.PI * 2);
          ctx.arc(6, 3.4, 2.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(6.6, -3.4, 0.8, 0, Math.PI * 2);
          ctx.arc(6.6, 3.4, 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore();

      // Minimap
      const mapSize = 118;
      const mapPad = 16;
      const mx = cssW - mapSize - mapPad;
      const my = cssH - mapSize - mapPad;
      ctx.fillStyle = 'rgba(7, 11, 22, 0.72)';
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(mx, my, mapSize, mapSize, 12);
      } else {
        ctx.rect(mx, my, mapSize, mapSize);
      }
      ctx.fill();
      ctx.stroke();
      const mapScale = (mapSize - 16) / (radius * 2);
      const mapOriginX = mx + mapSize / 2;
      const mapOriginY = my + mapSize / 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.arc(mapOriginX, mapOriginY, radius * mapScale, 0, Math.PI * 2);
      ctx.stroke();
      for (const snake of snakes) {
        const head = snake.body?.[0];
        if (!head) continue;
        ctx.fillStyle = snake.playerId === userRef.current ? '#fff' : snake.color;
        ctx.beginPath();
        ctx.arc(
          mapOriginX + (head.x - origin.x) * mapScale,
          mapOriginY + (head.y - origin.y) * mapScale,
          snake.playerId === userRef.current ? 3.4 : 2.4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '11px ui-sans-serif, system-ui';
      ctx.fillText(boostRef.current ? 'BOOST' : 'Mouse to steer · Hold click or Space to boost', 16, cssH - 16);

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [currentAngle]);

  return (
    <canvas
      ref={canvasRef}
      className="snake-io-canvas"
      aria-label="Snake.io arena"
    />
  );
}
