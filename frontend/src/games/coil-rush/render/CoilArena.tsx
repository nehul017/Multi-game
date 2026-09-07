'use client';

import { useCallback, useEffect, useRef } from 'react';
import { coilLive } from '../net/liveBoard';
import type { CoilInputState } from '../net/input';
import type { CoilBoard, CoilSteerInput } from '../types';
import { BOT_NAMES, mix, rgba } from './draw';

interface CoilArenaProps {
  currentUserId?: string;
  disabled?: boolean;
  playing?: boolean;
  input: CoilInputState;
  onSteer?: (input: CoilSteerInput) => void;
}

const WORLD = 2400;
const RADIUS = 1080;
const BASE_SPEED = 3.6;
const BOOST_MULT = 1.55;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function CoilArena({ currentUserId, disabled, playing, input, onSteer }: CoilArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<CoilBoard>(coilLive.get());
  const prevRef = useRef<CoilBoard>(coilLive.get());
  const receivedAt = useRef(performance.now());
  const cam = useRef({ x: WORLD / 2, y: WORLD / 2, zoom: 1 });
  const pointer = useRef({ x: 0, y: 0, inside: false });
  const keys = useRef(new Set<string>());
  const lastSteer = useRef({ angle: 0, boost: false, sent: 0 });
  const onSteerRef = useRef(onSteer);
  const userRef = useRef(currentUserId);
  const disabledRef = useRef(disabled);
  const playingRef = useRef(playing);
  const inputRef = useRef(input);

  onSteerRef.current = onSteer;
  userRef.current = currentUserId;
  disabledRef.current = disabled;
  playingRef.current = playing;
  inputRef.current = input;

  useEffect(() => {
    const apply = (next: CoilBoard) => {
      prevRef.current = boardRef.current;
      boardRef.current = next;
      receivedAt.current = performance.now();
    };
    apply(coilLive.get());
    return coilLive.subscribe(apply);
  }, []);

  const currentAngle = useCallback(() => {
    const next = boardRef.current;
    const me = next.snakes?.find((s) => s.playerId === userRef.current);
    const head = me?.body?.[0];
    if (inputRef.current.angle != null) return inputRef.current.angle;
    if (pointer.current.inside && head) {
      return Math.atan2(pointer.current.y - head.y, pointer.current.x - head.x);
    }
    const k = keys.current;
    let dx = 0;
    let dy = 0;
    if (k.has('ArrowRight') || k.has('d') || k.has('D')) dx += 1;
    if (k.has('ArrowLeft') || k.has('a') || k.has('A')) dx -= 1;
    if (k.has('ArrowDown') || k.has('s') || k.has('S')) dy += 1;
    if (k.has('ArrowUp') || k.has('w') || k.has('W')) dy -= 1;
    if (dx || dy) return Math.atan2(dy, dx);
    return me?.targetAngle ?? me?.angle ?? 0;
  }, []);

  useEffect(() => {
    const send = () => {
      if (disabledRef.current || !playingRef.current) return;
      const angle = currentAngle();
      const boosting = inputRef.current.boost;
      const prev = lastSteer.current;
      const now = performance.now();
      if (Math.abs(angle - prev.angle) < 0.035 && boosting === prev.boost && now - prev.sent < 80) return;
      lastSteer.current = { angle, boost: boosting, sent: now };
      onSteerRef.current?.({ angle, boost: boosting });
    };
    const id = window.setInterval(send, 32);
    return () => window.clearInterval(id);
  }, [currentAngle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const toWorld = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: cam.current.x + (clientX - rect.left - rect.width / 2) / cam.current.zoom,
        y: cam.current.y + (clientY - rect.top - rect.height / 2) / cam.current.zoom,
      };
    };
    const onMove = (e: PointerEvent) => {
      pointer.current = { ...toWorld(e.clientX, e.clientY), inside: true };
    };
    const onDown = (e: PointerEvent) => {
      if (e.button === 0) inputRef.current.boost = true;
      canvas.setPointerCapture(e.pointerId);
      onMove(e);
    };
    const onUp = () => {
      inputRef.current.boost = false;
    };
    const onLeave = () => {
      pointer.current.inside = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement | null)?.tagName || '')) return;
      keys.current.add(e.key);
      if (e.code === 'Space') {
        e.preventDefault();
        inputRef.current.boost = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key);
      if (e.code === 'Space') inputRef.current.boost = false;
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx) return;
    let frame = 0;

    const draw = () => {
      const next = boardRef.current;
      const prev = prevRef.current;
      const world = next.worldSize || WORLD;
      const radius = next.arenaRadius || RADIUS;
      const origin = next.origin || { x: world / 2, y: world / 2 };
      const elapsed = performance.now() - receivedAt.current;
      const t = Math.min(1, elapsed / 50);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const cssW = canvas.clientWidth || 960;
      const cssH = canvas.clientHeight || 540;
      const pixelW = Math.floor(cssW * dpr);
      const pixelH = Math.floor(cssH * dpr);
      if (canvas.width !== pixelW || canvas.height !== pixelH) {
        canvas.width = pixelW;
        canvas.height = pixelH;
      }

      const angle = currentAngle();
      const me = next.snakes?.find((s) => s.playerId === userRef.current);
      const mePrev = prev.snakes?.find((s) => s.playerId === userRef.current);
      const head = me?.body?.[0];
      const prevHead = mePrev?.body?.[0];
      const look = (me?.boosting || inputRef.current.boost ? BOOST_MULT : 1) * BASE_SPEED * 6;
      const follow = {
        x: lerp(prevHead?.x ?? origin.x, head?.x ?? origin.x, t) + Math.cos(angle) * look,
        y: lerp(prevHead?.y ?? origin.y, head?.y ?? origin.y, t) + Math.sin(angle) * look,
      };
      const zoom = Math.max(0.78, 1.05 - (me?.body?.length || 12) * 0.0028);
      cam.current.x = lerp(cam.current.x, follow.x, 0.18);
      cam.current.y = lerp(cam.current.y, follow.y, 0.18);
      cam.current.zoom = lerp(cam.current.zoom, zoom, 0.06);

      const viewPad = 80;
      const viewL = cam.current.x - cssW / 2 / cam.current.zoom - viewPad;
      const viewR = cam.current.x + cssW / 2 / cam.current.zoom + viewPad;
      const viewT = cam.current.y - cssH / 2 / cam.current.zoom - viewPad;
      const viewB = cam.current.y + cssH / 2 / cam.current.zoom + viewPad;
      const inView = (x: number, y: number) => x >= viewL && x <= viewR && y >= viewT && y <= viewB;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const floor = ctx.createRadialGradient(cssW * 0.5, cssH * 0.42, 40, cssW * 0.5, cssH * 0.5, Math.max(cssW, cssH) * 0.72);
      floor.addColorStop(0, '#12313a');
      floor.addColorStop(0.45, '#0b1c26');
      floor.addColorStop(1, '#050b10');
      ctx.fillStyle = floor;
      ctx.fillRect(0, 0, cssW, cssH);

      ctx.save();
      ctx.translate(cssW / 2, cssH / 2);
      ctx.scale(cam.current.zoom, cam.current.zoom);
      ctx.translate(-cam.current.x, -cam.current.y);

      ctx.beginPath();
      ctx.fillStyle = '#0a1922';
      ctx.arc(origin.x, origin.y, radius + 28, 0, Math.PI * 2);
      ctx.fill();

      const pulse = 0.55 + Math.sin(performance.now() / 480) * 0.45;
      const dots = 70;
      const dx0 = Math.floor(viewL / dots) * dots;
      const dy0 = Math.floor(viewT / dots) * dots;
      ctx.fillStyle = 'rgba(126, 232, 214, 0.07)';
      for (let x = dx0; x <= viewR; x += dots) {
        for (let y = dy0; y <= viewB; y += dots) {
          if ((x - origin.x) ** 2 + (y - origin.y) ** 2 > radius * radius) continue;
          ctx.beginPath();
          ctx.arc(x, y, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.lineWidth = 22;
      ctx.strokeStyle = 'rgba(46, 196, 182, 0.08)';
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 7;
      ctx.strokeStyle = `rgba(124, 255, 178, ${0.28 + pulse * 0.18})`;
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      for (const pellet of next.food || []) {
        if (!inView(pellet.x, pellet.y)) continue;
        const color = pellet.color || '#7CFFB2';
        const r = (pellet.r || 4) + (pellet.kind === 'crystal' ? pulse : pulse * 0.35);
        ctx.beginPath();
        ctx.fillStyle = rgba(color, 0.22);
        ctx.arc(pellet.x, pellet.y, r + 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(pellet.x, pellet.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.arc(pellet.x - r * 0.25, pellet.y - r * 0.28, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const snake of next.snakes || []) {
        const body = snake.body || [];
        if (!body.length) continue;
        const older = prev.snakes?.find((s) => s.playerId === snake.playerId);
        const step = body.length > 48 ? 2 : 1;
        const points: Array<{ x: number; y: number }> = [];
        for (let i = body.length - 1; i >= 0; i -= step) {
          points.push({
            x: lerp(older?.body?.[i]?.x ?? body[i].x, body[i].x, t),
            y: lerp(older?.body?.[i]?.y ?? body[i].y, body[i].y, t),
          });
        }
        const liveHead = body[0];
        const hx = lerp(older?.body?.[0]?.x ?? liveHead.x, liveHead.x, t);
        const hy = lerp(older?.body?.[0]?.y ?? liveHead.y, liveHead.y, t);
        points.push({ x: hx, y: hy });

        const thick = (snake.radius || 9) * (snake.isBoss ? 2.1 : 2.05);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = snake.alive ? 1 : 0.22;

        const strokePath = () => {
          ctx.beginPath();
          points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        };

        if (snake.boosting && snake.alive) {
          ctx.strokeStyle = rgba(snake.color, 0.28);
          ctx.lineWidth = thick + 10;
          strokePath();
          ctx.stroke();
        }

        ctx.strokeStyle = mix(snake.color, '#041016', 0.55);
        ctx.lineWidth = thick + 5;
        strokePath();
        ctx.stroke();

        ctx.strokeStyle = snake.color;
        ctx.lineWidth = thick;
        strokePath();
        ctx.stroke();

        ctx.strokeStyle = mix(snake.color, '#ffffff', 0.42);
        ctx.lineWidth = thick * 0.38;
        ctx.globalAlpha = snake.alive ? 0.55 : 0.12;
        ctx.beginPath();
        points.forEach((p, i) => {
          const px = p.x - 1.6;
          const py = p.y - 1.8;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.globalAlpha = snake.alive ? 1 : 0.22;

        const headR = (snake.radius || 9) * 1.35;
        const headFill = ctx.createRadialGradient(hx - 2, hy - 3, 1, hx, hy, headR);
        headFill.addColorStop(0, mix(snake.color, '#ffffff', 0.55));
        headFill.addColorStop(0.55, snake.color);
        headFill.addColorStop(1, mix(snake.color, '#041016', 0.35));
        ctx.fillStyle = mix(snake.color, '#041016', 0.45);
        ctx.beginPath();
        ctx.arc(hx, hy, headR + 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = headFill;
        ctx.beginPath();
        ctx.arc(hx, hy, headR, 0, Math.PI * 2);
        ctx.fill();

        if (snake.alive) {
          const facing = snake.playerId === userRef.current && playingRef.current ? angle : snake.angle || 0;
          ctx.save();
          ctx.translate(hx, hy);
          ctx.rotate(facing);
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.ellipse(6.4, -4.1, 3.1, 3.6, 0, 0, Math.PI * 2);
          ctx.ellipse(6.4, 4.1, 3.1, 3.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0b1220';
          ctx.beginPath();
          ctx.arc(7.4, -4.1, 1.55, 0, Math.PI * 2);
          ctx.arc(7.4, 4.1, 1.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(8, -4.6, 0.55, 0, Math.PI * 2);
          ctx.arc(8, 3.6, 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (inView(hx, hy)) {
            const mine = snake.playerId === userRef.current;
            const style = snake.playerId.split(':')[1] || '';
            const label = mine ? 'You' : snake.isBoss ? 'Titan' : BOT_NAMES[style] || 'Coil';
            ctx.font = `700 ${mine ? 13 : 11}px ui-sans-serif, system-ui`;
            ctx.textAlign = 'center';
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(4,10,16,0.7)';
            ctx.strokeText(label, hx, hy - headR - 8);
            ctx.fillStyle = mine ? '#7CFFB2' : 'rgba(255,255,255,0.88)';
            ctx.fillText(label, hx, hy - headR - 8);
          }
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      const vignette = ctx.createRadialGradient(cssW / 2, cssH / 2, Math.min(cssW, cssH) * 0.28, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.72);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(2,8,12,0.42)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, cssW, cssH);

      if (cssW >= 900) {
        const map = 118;
        const mx = cssW - map - 18;
        const my = cssH - map - 18;
        ctx.fillStyle = 'rgba(6,14,20,0.78)';
        ctx.strokeStyle = 'rgba(124, 255, 178, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect?.(mx, my, map, map, 16);
        if (!ctx.roundRect) ctx.rect(mx, my, map, map);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(46,196,182,0.25)';
        ctx.arc(mx + map / 2, my + map / 2, (map - 22) / 2, 0, Math.PI * 2);
        ctx.stroke();
        const scale = (map - 22) / (radius * 2);
        for (const snake of next.snakes || []) {
          const h = snake.body?.[0];
          if (!h) continue;
          ctx.fillStyle = snake.playerId === userRef.current ? '#fff' : snake.color;
          ctx.beginPath();
          ctx.arc(mx + map / 2 + (h.x - origin.x) * scale, my + map / 2 + (h.y - origin.y) * scale, snake.playerId === userRef.current ? 3.4 : 2.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [currentAngle]);

  return <canvas ref={canvasRef} className="coil-arena-canvas" aria-label="Coil Rush arena" />;
}
