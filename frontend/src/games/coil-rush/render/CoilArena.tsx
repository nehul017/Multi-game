'use client';

import { useCallback, useEffect, useRef } from 'react';
import { coilLive } from '../net/liveBoard';
import type { CoilInputState } from '../net/input';
import type { CoilBoard, CoilSteerInput } from '../types';
import { BOT_NAMES, drawFoodIcon, mix, rgba, SNACK_KINDS, spawnBurst, type CoilParticle, type FloatScore } from './draw';
import {
  BODY_SEGMENT_SPACING,
  PATH_RECORD_MIN,
  logicalCoilDistance,
  prunePath,
  recordHead,
  samplePath,
  seedPath,
  shouldResetTrail,
  visualSegmentSpacing,
  type PathPoint,
} from './path';

interface CoilArenaProps {
  currentUserId?: string;
  disabled?: boolean;
  playing?: boolean;
  input: CoilInputState;
  onSteer?: (input: CoilSteerInput) => void;
  names?: Record<string, string>;
}

const WORLD = 3200;
const RADIUS = 1480;
const BASE_SPEED = 3.6;
const BOOST_MULT = 1.72;
const MAX_VISUAL_SEGS = 420;

interface CoilTrail {
  points: PathPoint[];
  segs: PathPoint[];
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function CoilArena({ currentUserId, disabled, playing, input, onSteer, names }: CoilArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<CoilBoard>(coilLive.get());
  const prevRef = useRef<CoilBoard>(coilLive.get());
  const receivedAt = useRef(performance.now());
  const cam = useRef({ x: WORLD / 2, y: WORLD / 2, zoom: 1, shake: 0 });
  const pointer = useRef({ x: 0, y: 0, inside: false });
  const keys = useRef(new Set<string>());
  const lastSteer = useRef({ angle: 0, boost: false, sent: 0 });
  const seenFx = useRef(new Set<string>());
  const particles = useRef<CoilParticle[]>([]);
  const floats = useRef<FloatScore[]>([]);
  const predict = useRef({ x: 0, y: 0 });
  const trails = useRef(new Map<string, CoilTrail>());
  const onSteerRef = useRef(onSteer);
  const userRef = useRef(currentUserId);
  const disabledRef = useRef(disabled);
  const playingRef = useRef(playing);
  const inputRef = useRef(input);
  const namesRef = useRef(names);

  onSteerRef.current = onSteer;
  userRef.current = currentUserId;
  disabledRef.current = disabled;
  playingRef.current = playing;
  inputRef.current = input;
  namesRef.current = names;

  useEffect(() => {
    const apply = (next: CoilBoard) => {
      prevRef.current = boardRef.current;
      boardRef.current = next;
      receivedAt.current = performance.now();
      const me = next.snakes?.find((s) => s.playerId === userRef.current);
      if (me?.body?.[0]) predict.current = { x: me.body[0].x, y: me.body[0].y };
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
      if (boardRef.current.phase && boardRef.current.phase !== 'playing' && boardRef.current.phase !== 'countdown') return;
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
    let lastTs = performance.now();

    const draw = (ts: number) => {
      const dt = Math.min(40, ts - lastTs);
      lastTs = ts;
      const next = boardRef.current;
      const prev = prevRef.current;
      const world = next.worldSize || WORLD;
      const radius = next.arenaRadius || RADIUS;
      const origin = next.origin || { x: world / 2, y: world / 2 };
      const elapsed = performance.now() - receivedAt.current;
      const tickMs = next.tickRate || 50;
      const t = Math.min(1, elapsed / tickMs);
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
      const livePhase = next.phase || 'playing';
      const canPredict = Boolean(me?.alive && playingRef.current && livePhase === 'playing');
      if (canPredict && head) {
        const speed = BASE_SPEED * ((me?.boosting || inputRef.current.boost) ? BOOST_MULT : 1);
        const step = speed * (dt / tickMs);
        predict.current.x += Math.cos(angle) * step * 0.55;
        predict.current.y += Math.sin(angle) * step * 0.55;
        predict.current.x = lerp(predict.current.x, lerp(prevHead?.x ?? head.x, head.x, t), 0.22);
        predict.current.y = lerp(predict.current.y, lerp(prevHead?.y ?? head.y, head.y, t), 0.22);
      } else if (head) {
        predict.current.x = lerp(prevHead?.x ?? head.x, head.x, t);
        predict.current.y = lerp(prevHead?.y ?? head.y, head.y, t);
      }

      const follow = {
        x: predict.current.x || origin.x,
        y: predict.current.y || origin.y,
      };
      const zoom = Math.max(0.72, 1.08 - (me?.body?.length || 12) * 0.0024);
      cam.current.x = lerp(cam.current.x, follow.x, 0.16);
      cam.current.y = lerp(cam.current.y, follow.y, 0.16);
      cam.current.zoom = lerp(cam.current.zoom, zoom, 0.05);
      cam.current.shake *= 0.86;

      for (const ev of next.events || []) {
        if (seenFx.current.has(ev.id)) continue;
        seenFx.current.add(ev.id);
        if (ev.kind === 'death' || ev.kind === 'kill') cam.current.shake = 10;
        spawnBurst(particles.current, ev.x, ev.y, ev.kind === 'death' ? '#fb7185' : ev.kind === 'kill' ? '#fbbf24' : '#7CFFB2', ev.kind === 'death' ? 18 : 10);
        if (ev.value && ev.playerId === userRef.current) {
          floats.current.push({
            x: ev.x,
            y: ev.y,
            text: `+${ev.value}`,
            life: 1,
            color: ev.kind === 'kill' ? '#fbbf24' : '#e9d5ff',
          });
          if (floats.current.length > 16) floats.current.shift();
        }
      }
      if (seenFx.current.size > 80) {
        seenFx.current = new Set(Array.from(seenFx.current).slice(-40));
      }

      const shakeX = (Math.random() - 0.5) * cam.current.shake;
      const shakeY = (Math.random() - 0.5) * cam.current.shake;
      const viewPad = 90;
      const viewL = cam.current.x - cssW / 2 / cam.current.zoom - viewPad;
      const viewR = cam.current.x + cssW / 2 / cam.current.zoom + viewPad;
      const viewT = cam.current.y - cssH / 2 / cam.current.zoom - viewPad;
      const viewB = cam.current.y + cssH / 2 / cam.current.zoom + viewPad;
      const inView = (x: number, y: number) => x >= viewL && x <= viewR && y >= viewT && y <= viewB;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const floor = ctx.createRadialGradient(cssW * 0.5, cssH * 0.4, 30, cssW * 0.5, cssH * 0.5, Math.max(cssW, cssH) * 0.78);
      floor.addColorStop(0, '#1b1550');
      floor.addColorStop(0.42, '#120c2e');
      floor.addColorStop(1, '#070614');
      ctx.fillStyle = floor;
      ctx.fillRect(0, 0, cssW, cssH);

      ctx.save();
      ctx.translate(cssW / 2 + shakeX, cssH / 2 + shakeY);
      ctx.scale(cam.current.zoom, cam.current.zoom);
      ctx.translate(-cam.current.x, -cam.current.y);

      ctx.beginPath();
      ctx.fillStyle = '#14102f';
      ctx.arc(origin.x, origin.y, radius + 34, 0, Math.PI * 2);
      ctx.fill();

      const pulse = 0.55 + Math.sin(ts / 460) * 0.45;
      const cell = 64;
      const gx0 = Math.floor(viewL / cell) * cell;
      const gy0 = Math.floor(viewT / cell) * cell;
      ctx.strokeStyle = 'rgba(124, 108, 255, 0.07)';
      ctx.lineWidth = 1;
      for (let x = gx0; x <= viewR; x += cell) {
        ctx.beginPath();
        ctx.moveTo(x, viewT);
        ctx.lineTo(x, viewB);
        ctx.stroke();
      }
      for (let y = gy0; y <= viewB; y += cell) {
        ctx.beginPath();
        ctx.moveTo(viewL, y);
        ctx.lineTo(viewR, y);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(167, 139, 250, 0.08)';
      for (let x = gx0; x <= viewR; x += cell * 2) {
        for (let y = gy0; y <= viewB; y += cell * 2) {
          if ((x - origin.x) ** 2 + (y - origin.y) ** 2 > radius * radius) continue;
          ctx.beginPath();
          ctx.arc(x + 8, y + 10, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.lineWidth = 26;
      ctx.strokeStyle = 'rgba(91, 80, 255, 0.12)';
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 7;
      ctx.strokeStyle = `rgba(167, 139, 250, ${0.32 + pulse * 0.2})`;
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      for (const pellet of next.food || []) {
        if (!inView(pellet.x, pellet.y)) continue;
        const color = pellet.color || '#7CFFB2';
        const snack = SNACK_KINDS.has(pellet.kind || '');
        const r = (pellet.r || 4) + (snack || pellet.kind === 'crystal' || pellet.kind === 'star' ? pulse * 0.55 : pulse * 0.3);
        drawFoodIcon(ctx, pellet.kind, pellet.x, pellet.y, r, color, pulse);
      }

      const liveIds = new Set<string>();
      const debugPath =
        process.env.NODE_ENV !== 'production' &&
        typeof window !== 'undefined' &&
        /(?:^|[?&])coilDebug=1(?:&|$)/.test(window.location.search);

      for (const snake of next.snakes || []) {
        const body = snake.body || [];
        if (!body.length) continue;
        liveIds.add(snake.playerId);
        const older = prev.snakes?.find((s) => s.playerId === snake.playerId);
        const mine = snake.playerId === userRef.current;
        const hx = mine && canPredict ? predict.current.x : lerp(older?.body?.[0]?.x ?? body[0].x, body[0].x, t);
        const hy = mine && canPredict ? predict.current.y : lerp(older?.body?.[0]?.y ?? body[0].y, body[0].y, t);
        const ghosted = (snake.effects?.ghostUntil || 0) > (next.elapsedMs || 0);
        ctx.globalAlpha = snake.alive ? (ghosted ? 0.55 : 1) : 0.18;

        const baseR = (snake.radius || 9) * (snake.isBoss ? 1.35 : 1);
        const spacing = visualSegmentSpacing(baseR);
        const coilDist = logicalCoilDistance(body, snake.length, BODY_SEGMENT_SPACING);
        let trail = trails.current.get(snake.playerId);
        if (!trail) {
          trail = { points: [], segs: [] };
          trails.current.set(snake.playerId, trail);
        }
        const headPt = { x: hx, y: hy };
        if (shouldResetTrail(trail.points, headPt, Boolean(snake.alive))) {
          seedPath(trail.points, body);
          if (trail.points[0]) {
            trail.points[0].x = hx;
            trail.points[0].y = hy;
          } else {
            trail.points.push(headPt);
          }
        } else {
          recordHead(trail.points, headPt, PATH_RECORD_MIN);
        }
        prunePath(trail.points, coilDist + spacing * 2);
        const segCount = Math.min(MAX_VISUAL_SEGS, Math.max(body.length, Math.round(coilDist / spacing) + 1));
        const segs = samplePath(trail.points, segCount, spacing, trail.segs);
        for (let i = segs.length - 1; i >= 1; i--) {
          const p = segs[i];
          if (!inView(p.x, p.y)) continue;
          const falloff = 0.72 + (1 - i / segs.length) * 0.28;
          const r = baseR * falloff;
          ctx.beginPath();
          ctx.fillStyle = mix(snake.color, '#070614', 0.42);
          ctx.arc(p.x + 1.2, p.y + 1.8, r + 1.6, 0, Math.PI * 2);
          ctx.fill();
          const g = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.35, 1, p.x, p.y, r);
          g.addColorStop(0, mix(snake.color, '#ffffff', 0.42));
          g.addColorStop(0.55, snake.color);
          g.addColorStop(1, mix(snake.color, '#14081f', 0.35));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }

        if (snake.boosting && snake.alive) {
          ctx.beginPath();
          ctx.fillStyle = rgba(snake.color, 0.22);
          ctx.arc(hx, hy, baseR * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }

        const headR = baseR * 1.42;
        ctx.fillStyle = mix(snake.color, '#070614', 0.45);
        ctx.beginPath();
        ctx.arc(hx + 1.4, hy + 2.2, headR + 2.4, 0, Math.PI * 2);
        ctx.fill();
        const headFill = ctx.createRadialGradient(hx - 3, hy - 4, 1, hx, hy, headR);
        headFill.addColorStop(0, mix(snake.color, '#ffffff', 0.58));
        headFill.addColorStop(0.5, snake.color);
        headFill.addColorStop(1, mix(snake.color, '#14081f', 0.28));
        ctx.fillStyle = headFill;
        ctx.beginPath();
        ctx.arc(hx, hy, headR, 0, Math.PI * 2);
        ctx.fill();

        if (snake.alive) {
          const facing = mine && playingRef.current ? angle : snake.angle || 0;
          ctx.save();
          ctx.translate(hx, hy);
          ctx.rotate(facing);
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.ellipse(7.2, -4.4, 3.4, 3.9, 0, 0, Math.PI * 2);
          ctx.ellipse(7.2, 4.4, 3.4, 3.9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0b1220';
          ctx.beginPath();
          ctx.arc(8.2, -4.4, 1.65, 0, Math.PI * 2);
          ctx.arc(8.2, 4.4, 1.65, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(8.8, -4.95, 0.55, 0, Math.PI * 2);
          ctx.arc(8.8, 3.85, 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(20,8,24,0.85)';
          ctx.beginPath();
          ctx.ellipse(11.5, 0, 1.5, 1.05 + Math.sin(ts / 180) * 0.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (inView(hx, hy)) {
            const style = snake.playerId.split(':')[1] || '';
            const label =
              namesRef.current?.[snake.playerId] ||
              snake.name ||
              (mine ? 'You' : snake.isBoss ? 'Titan' : BOT_NAMES[style] || 'Coil');
            ctx.font = `700 ${mine ? 13 : 11}px ui-sans-serif, system-ui`;
            ctx.textAlign = 'center';
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(8,6,20,0.72)';
            ctx.strokeText(label, hx, hy - headR - 9);
            ctx.fillStyle = mine ? '#c4b5fd' : 'rgba(255,255,255,0.9)';
            ctx.fillText(label, hx, hy - headR - 9);
          }
        }

        if (debugPath) {
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let i = 0; i < trail.points.length; i++) {
            const p = trail.points[i];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          ctx.fillStyle = '#fbbf24';
          for (const p of segs) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(hx, hy, 2.4, 0, Math.PI * 2);
          ctx.fill();
          if (segs.length) {
            const tail = segs[segs.length - 1];
            ctx.fillStyle = '#fb7185';
            ctx.beginPath();
            ctx.arc(tail.x, tail.y, 2.4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }
      Array.from(trails.current.keys()).forEach((id) => {
        if (!liveIds.has(id)) trails.current.delete(id);
      });

      for (const p of particles.current) {
        if (p.life <= 0) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt / 900;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (const f of floats.current) {
        f.life -= dt / 900;
        f.y -= 0.35;
        ctx.globalAlpha = Math.max(0, f.life);
        ctx.font = '800 14px ui-sans-serif, system-ui';
        ctx.textAlign = 'center';
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      const vignette = ctx.createRadialGradient(cssW / 2, cssH / 2, Math.min(cssW, cssH) * 0.28, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.74);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(6,4,16,0.48)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, cssW, cssH);

      const map = cssW < 760 ? 78 : 118;
      const mx = 16;
      const my = cssW < 760 ? cssH - map - 148 : cssH - map - 16;
      ctx.fillStyle = 'rgba(10,8,24,0.78)';
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(mx, my, map, map, 16);
      else ctx.rect(mx, my, map, map);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(124,108,255,0.28)';
      ctx.arc(mx + map / 2, my + map / 2, (map - 22) / 2, 0, Math.PI * 2);
      ctx.stroke();
      const scale = (map - 22) / (radius * 2);
      for (const pellet of next.food || []) {
        if (
          pellet.kind !== 'crystal' &&
          pellet.kind !== 'ghost' &&
          pellet.kind !== 'multiplier' &&
          pellet.kind !== 'burger' &&
          pellet.kind !== 'pizza'
        ) continue;
        ctx.fillStyle = pellet.color || '#fff';
        ctx.beginPath();
        ctx.arc(mx + map / 2 + (pellet.x - origin.x) * scale, my + map / 2 + (pellet.y - origin.y) * scale, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const snake of next.snakes || []) {
        const h = snake.body?.[0];
        if (!h) continue;
        ctx.fillStyle = snake.playerId === userRef.current ? '#fff' : snake.color;
        ctx.beginPath();
        ctx.arc(
          mx + map / 2 + (h.x - origin.x) * scale,
          my + map / 2 + (h.y - origin.y) * scale,
          snake.playerId === userRef.current ? 3.4 : 2.2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [currentAngle]);

  return <canvas ref={canvasRef} className="coil-arena-canvas" aria-label="Coil Rush arena" />;
}
