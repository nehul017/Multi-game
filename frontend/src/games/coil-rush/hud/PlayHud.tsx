'use client';

import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { coilLive } from '../net/liveBoard';
import type { CoilInputState } from '../net/input';
import { BOT_NAMES } from '../render/draw';
import type { CoilPhase, CoilSnake } from '../types';
import { Joystick } from './Joystick';

interface PlayHudProps {
  username?: string;
  avatar?: string;
  currentUserId?: string;
  names?: Record<string, string>;
  input: CoilInputState;
  connected?: boolean;
  reconnecting?: boolean;
  onBack?: () => void;
  onToggleChat?: () => void;
  onToggleHelp?: () => void;
  chatOpen?: boolean;
}

const formatTime = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const labelFor = (snake: CoilSnake, names?: Record<string, string>, mine?: boolean) => {
  if (mine) return 'You';
  if (names?.[snake.playerId]) return names[snake.playerId];
  if (snake.name) return snake.name;
  if (snake.isBoss) return 'Titan';
  if (snake.isBot) return BOT_NAMES[snake.playerId.split(':')[1] || ''] || 'Coil';
  return 'Rider';
};

const phaseCopy = (phase?: CoilPhase) => {
  if (phase === 'countdown') return 'Get ready';
  if (phase === 'results' || phase === 'round_end') return 'Round over';
  if (phase === 'waiting') return 'Waiting for players';
  return 'Survive';
};

export function PlayHud({
  username,
  avatar,
  currentUserId,
  names,
  input,
  connected,
  reconnecting,
  onBack,
  onToggleChat,
  onToggleHelp,
  chatOpen,
}: PlayHudProps) {
  const [hud, setHud] = useState(() => {
    const board = coilLive.get();
    return {
      snakes: board.snakes || [],
      elapsedMs: board.elapsedMs || 0,
      timeLimitMs: board.timeLimitMs,
      phase: board.phase,
      countdownMs: board.countdownMs || 0,
      online: board.online || 0,
    };
  });

  useEffect(() => {
    let last = 0;
    return coilLive.subscribe((board) => {
      const now = performance.now();
      if (now - last < 100) return;
      last = now;
      setHud({
        snakes: board.snakes || [],
        elapsedMs: board.elapsedMs || 0,
        timeLimitMs: board.timeLimitMs,
        phase: board.phase,
        countdownMs: board.countdownMs || 0,
        online: board.online || board.snakes?.filter((s) => !s.isBot).length || 0,
      });
    });
  }, []);

  const me = hud.snakes.find((s) => s.playerId === currentUserId);
  const ranked = useMemo(() => [...hud.snakes].sort((a, b) => b.score - a.score), [hud.snakes]);
  const rank = me ? ranked.findIndex((s) => s.playerId === me.playerId) + 1 : 0;
  const remaining = hud.timeLimitMs ? Math.max(0, hud.timeLimitMs - hud.elapsedMs) : hud.elapsedMs;
  const progress = hud.timeLimitMs ? Math.max(0, Math.min(1, remaining / hud.timeLimitMs)) : 1;
  const top = ranked.slice(0, 10);
  const outside = Boolean(me && rank > 10);
  const countNum = hud.phase === 'countdown' ? Math.ceil((hud.countdownMs || 0) / 1000) : 0;
  const effects = me?.effects;
  const now = hud.elapsedMs;

  return (
    <div className="coil-hud">
      <div className="coil-hud-tl">
        <Avatar name={username || 'You'} src={avatar} size="sm" />
        <div>
          <strong>{Math.floor(me?.score || 0)}</strong>
          <span>
            {username || 'You'} · Len {me?.length ?? me?.body.length ?? 0}
          </span>
        </div>
      </div>

      <div className="coil-hud-tc">
        <span className="coil-hud-objective">{phaseCopy(hud.phase)}</span>
        <em>{hud.phase === 'countdown' ? (countNum > 0 ? countNum : 'GO') : formatTime(remaining)}</em>
        {hud.timeLimitMs ? <b className="coil-timer-bar" style={{ transform: `scaleX(${progress})` }} /> : null}
        <span className="coil-rank-flash">
          {hud.online} online · #{rank || '—'}
        </span>
      </div>

      <ol className="coil-hud-tr">
        <li className="coil-hud-tr-title">🏆 Leaderboard</li>
        {top.map((snake, i) => (
          <li key={snake.playerId} className={me && snake.playerId === me.playerId ? 'is-me' : ''}>
            <b>{i + 1}</b>
            <i style={{ background: snake.color }} />
            <span>{labelFor(snake, names, snake.playerId === currentUserId)}</span>
            <em>{Math.floor(snake.score)}</em>
          </li>
        ))}
        {outside && me && (
          <li className="is-me coil-hud-you">
            <b>{rank}</b>
            <i style={{ background: me.color }} />
            <span>You</span>
            <em>{Math.floor(me.score)}</em>
          </li>
        )}
      </ol>

      <div className="coil-conn" data-ok={connected && !reconnecting ? '1' : '0'}>
        <i />
        {reconnecting ? 'Reconnecting…' : connected ? 'Connected' : 'Offline'}
      </div>

      {hud.phase === 'countdown' && (
        <div className="coil-count-banner" aria-hidden>
          {countNum > 0 ? countNum : 'GO!'}
        </div>
      )}

      <div className="coil-fx-pills">
        {effects?.speedUntil && effects.speedUntil > now && <span>Speed</span>}
        {effects?.magnetUntil && effects.magnetUntil > now && <span>Magnet</span>}
        {effects?.shieldUntil && effects.shieldUntil > now && <span>Shield</span>}
        {effects?.ghostUntil && effects.ghostUntil > now && <span>Ghost</span>}
        {effects?.multiplierUntil && effects.multiplierUntil > now && <span>2x</span>}
        {(me?.combo || 0) > 1 && <span>Combo x{me?.combo}</span>}
      </div>

      <Joystick onAngle={(angle) => { input.angle = angle; }} />

      <div className="coil-hud-br">
        <button type="button" className="coil-icon-btn" onClick={onBack}>
          ← Games
        </button>
        <button type="button" className="coil-icon-btn" onClick={onToggleHelp}>
          Help
        </button>
        <button type="button" className={`coil-icon-btn ${chatOpen ? 'is-on' : ''}`} onClick={onToggleChat}>
          Chat
        </button>
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
    </div>
  );
}
