'use client';

import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { coilLive } from '../net/liveBoard';
import type { CoilInputState } from '../net/input';
import { BOT_NAMES } from '../render/draw';
import type { CoilSnake } from '../types';
import { Joystick } from './Joystick';

interface PlayHudProps {
  username?: string;
  avatar?: string;
  currentUserId?: string;
  names?: Record<string, string>;
  input: CoilInputState;
}

const formatTime = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const labelFor = (snake: CoilSnake, names?: Record<string, string>, mine?: boolean) => {
  if (mine) return 'You';
  if (names?.[snake.playerId]) return names[snake.playerId];
  if (snake.isBoss) return 'Titan';
  if (snake.isBot) return BOT_NAMES[snake.playerId.split(':')[1] || ''] || 'Coil';
  return 'Rider';
};

export function PlayHud({ username, avatar, currentUserId, names, input }: PlayHudProps) {
  const [hud, setHud] = useState(() => {
    const board = coilLive.get();
    return {
      snakes: board.snakes || [],
      elapsedMs: board.elapsedMs || 0,
      timeLimitMs: board.timeLimitMs,
    };
  });

  useEffect(() => {
    let last = 0;
    return coilLive.subscribe((board) => {
      const now = performance.now();
      if (now - last < 120) return;
      last = now;
      setHud({
        snakes: board.snakes || [],
        elapsedMs: board.elapsedMs || 0,
        timeLimitMs: board.timeLimitMs,
      });
    });
  }, []);

  const me = hud.snakes.find((s) => s.playerId === currentUserId);
  const ranked = [...hud.snakes].sort((a, b) => b.score - a.score);
  const rank = me ? ranked.findIndex((s) => s.playerId === me.playerId) + 1 : 0;
  const timed = hud.timeLimitMs && hud.timeLimitMs <= 180_000;
  const clock = timed ? Math.max(0, hud.timeLimitMs! - hud.elapsedMs) : hud.elapsedMs;

  return (
    <div className="coil-hud">
      <div className="coil-hud-tl">
        <Avatar name={username || 'You'} src={avatar} size="sm" />
        <div>
          <strong>{Math.floor(me?.score || 0)}</strong>
          <span>Mass · {me?.body.length || 0}</span>
        </div>
      </div>
      <div className="coil-hud-tc">
        <em>{formatTime(clock)}</em>
        <span className="coil-rank-flash">{timed ? 'Time left' : 'Survived'} · #{rank || '—'}</span>
      </div>
      <ol className="coil-hud-tr">
        <li className="coil-hud-tr-title">Live coils</li>
        {ranked.slice(0, 5).map((snake, i) => (
          <li key={snake.playerId} className={me && snake.playerId === me.playerId ? 'is-me' : ''}>
            <b>{i + 1}</b>
            <i style={{ background: snake.color }} />
            <span>{labelFor(snake, names, snake.playerId === currentUserId)}</span>
            <em>{Math.floor(snake.score)}</em>
          </li>
        ))}
      </ol>
      <Joystick onAngle={(angle) => { input.angle = angle; }} />
      <button
        type="button"
        className="coil-boost"
        onPointerDown={() => { input.boost = true; }}
        onPointerUp={() => { input.boost = false; }}
        onPointerCancel={() => { input.boost = false; }}
        onPointerLeave={() => { input.boost = false; }}
      >
        BOOST
        <b style={{ width: `${me?.energy ?? 100}%` }} />
      </button>
    </div>
  );
}
