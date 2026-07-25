'use client';

import {
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  ChevronUp,
  Clock,
  Cpu,
  Crown,
  Ghost,
  Gauge,
  LogOut,
  Maximize2,
  MessageSquare,
  Minimize2,
  Send,
  Settings,
  Shield,
  Signal,
  Skull,
  Snowflake,
  Sparkles,
  Star,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface Point {
  x: number;
  y: number;
}

interface Snake {
  playerId: string;
  body: Point[];
  direction: string;
  alive: boolean;
  score: number;
  color: string;
}

interface SnakeState {
  gridWidth: number;
  gridHeight: number;
  snakes: Snake[];
  food: Point[];
  tickRate?: number;
}

interface SnakePlayer {
  userId: string;
  username: string;
  avatar?: string;
  elo?: number | string;
  ping?: number;
}

export interface SnakeChatMessage {
  id?: string;
  userId?: string;
  user: string;
  text: string;
  timestamp?: string | number;
}

export interface SnakeBoardProps {
  board?: unknown;
  disabled?: boolean;
  onMove?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  players?: SnakePlayer[];
  spectators?: string[];
  currentUserId?: string;
  currentUsername?: string;
  roomId?: string;
  gameStatus?: 'waiting' | 'countdown' | 'playing' | 'finished' | string;
  gameStartedAt?: number | null;
  onLeave?: () => void;
  onSurrender?: () => void;
  onPlayAgain?: () => void;
  chatMessages?: SnakeChatMessage[];
  onSendChat?: (text: string) => void;
  latency?: number;
}

type Dir = 'up' | 'down' | 'left' | 'right';

const DEFAULT_STATE: SnakeState = {
  gridWidth: 30,
  gridHeight: 30,
  snakes: [],
  food: [],
  tickRate: 150,
};

const POWERUP_LOADOUT: {
  key: string;
  label: string;
  icon: typeof Shield;
  colorA: string;
  colorB: string;
  cooldown: number;
  duration: number;
}[] = [
  { key: 'shield', label: 'Shield', icon: Shield, colorA: '#00D4FF', colorB: '#6C5CE7', cooldown: 25, duration: 6 },
  { key: 'speed', label: 'Boost', icon: Zap, colorA: '#00FF88', colorB: '#00D4FF', cooldown: 18, duration: 4 },
  { key: 'magnet', label: 'Magnet', icon: Sparkles, colorA: '#FFC857', colorB: '#FF4D6D', cooldown: 22, duration: 5 },
  { key: 'double', label: '2x Points', icon: Star, colorA: '#FFC857', colorB: '#6C5CE7', cooldown: 30, duration: 8 },
  { key: 'freeze', label: 'Freeze', icon: Snowflake, colorA: '#7feaff', colorB: '#00D4FF', cooldown: 28, duration: 3 },
  { key: 'ghost', label: 'Ghost', icon: Ghost, colorA: '#c8bfff', colorB: '#6C5CE7', cooldown: 35, duration: 5 },
];

function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return '0:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function useElapsed(startedAt?: number | null, running = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      setNow(Date.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  if (!startedAt) return 0;
  return Math.max(0, now - startedAt);
}

function useFps() {
  const [fps, setFps] = useState(60);
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const loop = (t: number) => {
      frames += 1;
      if (t - last >= 1000) {
        setFps(Math.round((frames * 1000) / (t - last)));
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function directionAngle(dir: string) {
  switch (dir) {
    case 'up':
      return 0;
    case 'right':
      return 90;
    case 'down':
      return 180;
    case 'left':
      return 270;
    default:
      return 0;
  }
}

function eyeOffsets(dir: string): Array<{ top: string; left: string }> {
  switch (dir) {
    case 'up':
      return [
        { top: '18%', left: '22%' },
        { top: '18%', left: '58%' },
      ];
    case 'down':
      return [
        { top: '58%', left: '22%' },
        { top: '58%', left: '58%' },
      ];
    case 'left':
      return [
        { top: '22%', left: '18%' },
        { top: '58%', left: '18%' },
      ];
    case 'right':
    default:
      return [
        { top: '22%', left: '58%' },
        { top: '58%', left: '58%' },
      ];
  }
}

function usePrevious<T>(value: T) {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

interface ScorePop {
  id: number;
  x: number;
  y: number;
  amount: number;
}

// ── Sub-components ──

interface HeaderProps {
  roomId?: string;
  playersCount: number;
  latency: number;
  soundOn: boolean;
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onOpenSettings: () => void;
  onLeave?: () => void;
  currentUsername?: string;
  currentAvatar?: string;
  connectionOn: boolean;
}

function SnakeHeader({
  roomId,
  playersCount,
  latency,
  soundOn,
  onToggleSound,
  onToggleFullscreen,
  isFullscreen,
  onOpenSettings,
  onLeave,
  currentUsername,
  currentAvatar,
  connectionOn,
}: HeaderProps) {
  const shortRoom = roomId ? roomId.slice(-6).toUpperCase() : '——————';
  const pingClass =
    latency < 60 ? 'snake-pill-live' : latency < 140 ? 'snake-pill-cyan' : 'snake-pill-purple';
  return (
    <div className="snake-header flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="snake-logo-icon">
          <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
            <path
              d="M6 20c0-4 3-6 6-6h4c3 0 4-1.5 4-3s-1-3-3-3h-7"
              stroke="#0B1020"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="8" cy="22" r="2.4" fill="#0B1020" />
            <circle cx="7.5" cy="21.5" r="0.7" fill="#00FF88" />
          </svg>
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-white/50">
            Multiplayer Arena
          </span>
          <span
            className="text-lg sm:text-xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #00FF88 0%, #00D4FF 50%, #6C5CE7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            SNAKE .IO
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 mx-4">
        <span className="snake-pill">
          <span className="text-white/45">ROOM</span>
          <span className="text-white font-mono">{shortRoom}</span>
        </span>
        <span className="snake-pill snake-pill-cyan">
          <Users className="w-3 h-3" /> {playersCount}
        </span>
        <span className={cn('snake-pill', pingClass)}>
          <Signal className="w-3 h-3" />
          {connectionOn ? `${latency}ms` : 'OFFLINE'}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          className="snake-icon-btn"
          aria-label={soundOn ? 'Mute audio' : 'Unmute audio'}
          onClick={onToggleSound}
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
        <button
          type="button"
          className="snake-icon-btn"
          aria-label="Toggle fullscreen"
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <button
          type="button"
          className="snake-icon-btn"
          aria-label="Open settings"
          onClick={onOpenSettings}
        >
          <Settings className="w-4 h-4" />
        </button>
        {onLeave && (
          <button
            type="button"
            className="snake-icon-btn snake-icon-btn-danger"
            aria-label="Leave game"
            onClick={onLeave}
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
        <div className="ml-1">
          <Avatar name={currentUsername || 'You'} src={currentAvatar} size="sm" online />
        </div>
      </div>

      <div className="flex md:hidden w-full items-center gap-2 pt-1">
        <span className="snake-pill">
          <span className="text-white/45">ROOM</span>
          <span className="text-white font-mono">{shortRoom}</span>
        </span>
        <span className="snake-pill snake-pill-cyan">
          <Users className="w-3 h-3" /> {playersCount}
        </span>
        <span className={cn('snake-pill', pingClass)}>
          <Signal className="w-3 h-3" />
          {connectionOn ? `${latency}ms` : 'OFFLINE'}
        </span>
      </div>
    </div>
  );
}

interface PlayersListProps {
  snakes: Snake[];
  playersMeta: Map<string, SnakePlayer>;
  currentUserId?: string;
  rank: Map<string, number>;
}

function PlayersList({ snakes, playersMeta, currentUserId, rank }: PlayersListProps) {
  if (snakes.length === 0) {
    return (
      <p className="text-center text-xs text-white/40 py-4">
        Waiting for players to join…
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {snakes.map((s) => {
        const meta = playersMeta.get(s.playerId);
        const isMe = currentUserId && s.playerId === currentUserId;
        const r = rank.get(s.playerId) ?? snakes.length;
        return (
          <div
            key={s.playerId}
            className={cn('snake-player-row', isMe && 'snake-player-row-me')}
          >
            <Avatar name={meta?.username || 'Player'} src={meta?.avatar} size="sm" online={s.alive} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold truncate">
                  {meta?.username || `Player ${s.playerId.slice(-4)}`}
                </span>
                <span
                  className="snake-color-chip"
                  style={{ ['--chip' as string]: s.color } as React.CSSProperties}
                />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/45 mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <Trophy className="w-2.5 h-2.5" /> #{r}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Signal className="w-2.5 h-2.5" /> {meta?.ping ?? Math.max(20, 40 + ((s.playerId.charCodeAt(0) || 0) % 60))}ms
                </span>
                <span>Len {s.body.length}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span
                className="text-sm font-extrabold font-mono"
                style={{ color: s.alive ? '#ffffff' : 'rgba(255,255,255,0.4)' }}
              >
                {s.score}
              </span>
              <span
                className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider',
                  s.alive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-400/25'
                )}
              >
                {s.alive ? 'Alive' : 'Dead'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface StatsPanelProps {
  elapsedMs: number;
  gridWidth: number;
  gridHeight: number;
  tickRate: number;
  totalFood: number;
  activePowerups: number;
  mode: string;
}

function StatsPanel({
  elapsedMs,
  gridWidth,
  gridHeight,
  tickRate,
  totalFood,
  activePowerups,
  mode,
}: StatsPanelProps) {
  const speed = Math.max(1, Math.round(1000 / Math.max(tickRate, 50)));
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="snake-stat">
        <span className="snake-stat-label flex items-center gap-1">
          <Clock className="w-3 h-3" /> Time
        </span>
        <span className="snake-stat-value">{formatDuration(elapsedMs)}</span>
      </div>
      <div className="snake-stat">
        <span className="snake-stat-label flex items-center gap-1">
          <Gauge className="w-3 h-3" /> Speed
        </span>
        <span className="snake-stat-value">{speed}Hz</span>
      </div>
      <div className="snake-stat">
        <span className="snake-stat-label flex items-center gap-1">
          <Cpu className="w-3 h-3" /> Arena
        </span>
        <span className="snake-stat-value">
          {gridWidth}×{gridHeight}
        </span>
      </div>
      <div className="snake-stat">
        <span className="snake-stat-label flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Food
        </span>
        <span className="snake-stat-value">{totalFood}</span>
      </div>
      <div className="snake-stat">
        <span className="snake-stat-label flex items-center gap-1">
          <Zap className="w-3 h-3" /> Power-ups
        </span>
        <span className="snake-stat-value">{activePowerups}</span>
      </div>
      <div className="snake-stat">
        <span className="snake-stat-label flex items-center gap-1">
          <Activity className="w-3 h-3" /> Mode
        </span>
        <span className="snake-stat-value text-sm">{mode}</span>
      </div>
    </div>
  );
}

interface AchievementsProps {
  highestScore: number;
  longest: number;
  kills: number;
  wins: number;
}

function Achievements({ highestScore, longest, kills, wins }: AchievementsProps) {
  const items = [
    { icon: Crown, label: 'High Score', value: highestScore, color: '#FFC857' },
    { icon: ChevronUp, label: 'Longest', value: longest, color: '#00FF88' },
    { icon: Skull, label: 'Kills', value: kills, color: '#FF4D6D' },
    { icon: Trophy, label: 'Wins', value: wins, color: '#6C5CE7' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="snake-stat">
          <span className="snake-stat-label flex items-center gap-1">
            <Icon className="w-3 h-3" style={{ color }} /> {label}
          </span>
          <span className="snake-stat-value" style={{ color }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

interface PowerupPanelProps {
  activeMap: Record<string, { until: number }>;
  cooldownMap: Record<string, number>;
}

function PowerupPanel({ activeMap, cooldownMap }: PowerupPanelProps) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 300);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="grid grid-cols-2 gap-2">
      {POWERUP_LOADOUT.map((p) => {
        const active = activeMap[p.key];
        const activeLeftMs = active ? Math.max(0, active.until - now) : 0;
        const cd = cooldownMap[p.key] ?? 0;
        const isActive = activeLeftMs > 0;
        const progress = isActive
          ? activeLeftMs / (p.duration * 1000)
          : cd > 0
            ? 1 - cd / p.cooldown
            : 1;
        const Icon = p.icon;
        return (
          <div
            key={p.key}
            className={cn('snake-powerup-slot', isActive && 'snake-powerup-slot-active')}
          >
            <div className="flex items-center gap-2">
              <div
                className="snake-powerup-icon"
                style={
                  {
                    ['--pow-a' as string]: p.colorA,
                    ['--pow-b' as string]: p.colorB,
                  } as React.CSSProperties
                }
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate">{p.label}</p>
                <p className="text-[9px] text-white/45 uppercase tracking-wider">
                  {isActive
                    ? `${Math.ceil(activeLeftMs / 1000)}s left`
                    : cd > 0
                      ? `${Math.ceil(cd)}s cooldown`
                      : 'Ready'}
                </p>
              </div>
            </div>
            <div className="snake-cooldown-bar mt-2">
              <span
                style={
                  {
                    transform: `scaleX(${Math.max(0, Math.min(1, progress))})`,
                    ['--pow-a' as string]: p.colorA,
                    ['--pow-b' as string]: p.colorB,
                  } as React.CSSProperties
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ChatPanelProps {
  messages: SnakeChatMessage[];
  onSend?: (text: string) => void;
  currentUserId?: string;
  currentUsername?: string;
}

function ChatPanel({ messages, onSend, currentUserId, currentUsername }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const submit = () => {
    const v = input.trim();
    if (!v || !onSend) return;
    onSend(v);
    setInput('');
  };

  return (
    <div className="flex flex-col h-64">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
        <p className="snake-panel-title">Live Chat</p>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1 scrollbar-none"
      >
        {messages.length === 0 ? (
          <p className="text-[11px] text-white/40 text-center py-4">
            Trash talk your opponent 🐍
          </p>
        ) : (
          messages.map((m, i) => {
            const mine =
              (currentUsername && m.user === currentUsername) ||
              (currentUserId && m.userId === currentUserId);
            return (
              <div
                key={m.id || `${m.user}-${i}-${m.text}`}
                className={cn(
                  'snake-chat-bubble',
                  mine ? 'snake-chat-bubble-me' : 'snake-chat-bubble-them'
                )}
              >
                <p className="text-[10px] font-semibold opacity-70 mb-0.5">{m.user}</p>
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
            );
          })
        )}
      </div>
      {onSend && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              e.stopPropagation();
            }}
            placeholder="Type a message…"
            className="snake-chat-input flex-1"
            aria-label="Chat message"
          />
          <button
            type="button"
            onClick={submit}
            aria-label="Send"
            className="snake-icon-btn"
            style={{
              background: 'linear-gradient(135deg, #6C5CE7, #00D4FF)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

interface LeaderboardProps {
  snakes: Snake[];
  playersMeta: Map<string, SnakePlayer>;
}

function Leaderboard({ snakes, playersMeta }: LeaderboardProps) {
  const sorted = [...snakes].sort((a, b) => b.score - a.score);
  if (sorted.length === 0) {
    return <p className="text-center text-[11px] text-white/40 py-3">No players yet</p>;
  }
  return (
    <div className="space-y-1">
      <AnimatePresence initial={false}>
        {sorted.map((s, i) => {
          const meta = playersMeta.get(s.playerId);
          return (
            <motion.div
              key={s.playerId}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="snake-lb-row"
            >
              <span
                className={cn(
                  'snake-lb-rank',
                  i === 0 && 'snake-lb-rank-1',
                  i === 1 && 'snake-lb-rank-2',
                  i === 2 && 'snake-lb-rank-3'
                )}
              >
                {i + 1}
              </span>
              <span
                className="snake-color-chip"
                style={{ ['--chip' as string]: s.color } as React.CSSProperties}
              />
              <span className="text-[12px] font-semibold truncate flex-1">
                {meta?.username || `Player ${s.playerId.slice(-4)}`}
              </span>
              <span className="text-[12px] font-extrabold font-mono">{s.score}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

interface MiniMapProps {
  snakes: Snake[];
  food: Point[];
  gridWidth: number;
  gridHeight: number;
  currentUserId?: string;
}

function MiniMap({ snakes, food, gridWidth, gridHeight, currentUserId }: MiniMapProps) {
  return (
    <div className="snake-minimap">
      {food.map((f, i) => (
        <span
          key={`mmf-${i}`}
          className="snake-minimap-dot"
          style={{
            left: `${(f.x / gridWidth) * 100}%`,
            top: `${(f.y / gridHeight) * 100}%`,
            ['--dot' as string]: '#FFC857',
          } as React.CSSProperties}
        />
      ))}
      {snakes.map((s) => {
        if (!s.alive || s.body.length === 0) return null;
        const head = s.body[0];
        const isMe = currentUserId && s.playerId === currentUserId;
        return (
          <span
            key={`mms-${s.playerId}`}
            className="snake-minimap-dot"
            style={{
              left: `${(head.x / gridWidth) * 100}%`,
              top: `${(head.y / gridHeight) * 100}%`,
              width: isMe ? 8 : 6,
              height: isMe ? 8 : 6,
              ['--dot' as string]: s.color,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

interface DirectionalPadProps {
  onMove: (dir: Dir) => void;
  disabled?: boolean;
  activeDir?: Dir | null;
}

function DirectionalPad({ onMove, disabled, activeDir }: DirectionalPadProps) {
  const [ripples, setRipples] = useState<Record<Dir, { id: number; x: number; y: number } | null>>({
    up: null,
    down: null,
    left: null,
    right: null,
  });

  const buttons: Array<{ dir: Dir; icon: typeof ArrowUp; className: string; primary?: boolean }> = [
    { dir: 'up', icon: ArrowUp, className: 'col-start-2 row-start-1', primary: true },
    { dir: 'left', icon: ArrowLeft, className: 'col-start-1 row-start-2' },
    { dir: 'down', icon: ArrowDown, className: 'col-start-2 row-start-2' },
    { dir: 'right', icon: ArrowRight, className: 'col-start-3 row-start-2' },
  ];

  const trigger = (dir: Dir, e: ReactMouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples((prev) => ({ ...prev, [dir]: { id, x, y } }));
    onMove(dir);
    setTimeout(() => {
      setRipples((prev) => (prev[dir]?.id === id ? { ...prev, [dir]: null } : prev));
    }, 600);
  };

  return (
    <div className="snake-pad">
      {buttons.map(({ dir, icon: Icon, className, primary }) => {
        const ripple = ripples[dir];
        const isActive = activeDir === dir;
        return (
          <button
            key={dir}
            type="button"
            disabled={disabled}
            onClick={(e) => trigger(dir, e)}
            className={cn(
              'snake-pad-btn',
              className,
              primary && 'snake-pad-btn-primary',
              isActive && 'ring-2 ring-cyan-400/60',
              disabled && 'opacity-40 cursor-not-allowed'
            )}
            aria-label={`Move ${dir}`}
          >
            <Icon className="w-5 h-5 relative z-[1]" />
            {ripple && (
              <span
                className="snake-pad-ripple"
                style={{
                  width: 12,
                  height: 12,
                  left: ripple.x - 6,
                  top: ripple.y - 6,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface StatusBarProps {
  latency: number;
  fps: number;
  connectionOn: boolean;
  roomId?: string;
  playersCount: number;
}

function StatusBar({ latency, fps, connectionOn, roomId, playersCount }: StatusBarProps) {
  const short = roomId ? roomId.slice(-8).toUpperCase() : '——————';
  const serverColor = connectionOn ? '#00FF88' : '#FF4D6D';
  return (
    <div className="snake-statusbar">
      <span className="snake-statusbar-item">
        <span
          className="snake-statusbar-dot"
          style={{ ['--dot' as string]: serverColor } as React.CSSProperties}
        />
        {connectionOn ? 'Server: Online' : 'Server: Offline'}
      </span>
      <span className="snake-statusbar-item">Ping <span className="text-white">{latency}ms</span></span>
      <span className="snake-statusbar-item">
        FPS <span className="text-white">{fps}</span>
      </span>
      <span className="snake-statusbar-item">
        Players <span className="text-white">{playersCount}</span>
      </span>
      <span className="snake-statusbar-item">
        Room <span className="text-white">{short}</span>
      </span>
      <span className="snake-statusbar-item ml-auto opacity-70">v2.0.0 · Snake.io</span>
    </div>
  );
}

// ── Main SnakeBoard ──

export function SnakeBoard({
  board,
  disabled,
  onMove,
  players = [],
  spectators = [],
  currentUserId,
  currentUsername,
  roomId,
  gameStatus = 'playing',
  gameStartedAt,
  onLeave,
  onSurrender,
  onPlayAgain,
  chatMessages = [],
  onSendChat,
  latency = 42,
}: SnakeBoardProps) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const boardWrapRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(20);
  const [shake, setShake] = useState(0);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const [scorePopId, setScorePopId] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [musicVol, setMusicVol] = useState(60);
  const [sfxVol, setSfxVol] = useState(80);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDir, setActiveDir] = useState<Dir | null>(null);

  const state = (board || DEFAULT_STATE) as SnakeState;
  const gridWidth = state.gridWidth || 30;
  const gridHeight = state.gridHeight || 30;
  const snakes = state.snakes || [];
  const food = state.food || [];
  const tickRate = state.tickRate || 150;

  const activePowerups: Record<string, { until: number }> = useMemo(() => ({}), []);
  const cooldownMap: Record<string, number> = useMemo(() => ({}), []);

  const running = gameStatus === 'playing';
  const elapsedMs = useElapsed(gameStartedAt, running);
  const fps = useFps();

  const playersMeta = useMemo(() => {
    const map = new Map<string, SnakePlayer>();
    players.forEach((p) => map.set(p.userId, p));
    return map;
  }, [players]);

  const rank = useMemo(() => {
    const sorted = [...snakes].sort((a, b) => b.score - a.score);
    const m = new Map<string, number>();
    sorted.forEach((s, i) => m.set(s.playerId, i + 1));
    return m;
  }, [snakes]);

  const highestScore = useMemo(() => snakes.reduce((max, s) => Math.max(max, s.score), 0), [snakes]);
  const longest = useMemo(
    () => snakes.reduce((max, s) => Math.max(max, s.body.length), 0),
    [snakes],
  );

  const myScore = useMemo(() => {
    if (!currentUserId) return 0;
    const me = snakes.find((s) => s.playerId === currentUserId);
    return me?.score || 0;
  }, [snakes, currentUserId]);

  const prevSnakes = usePrevious(snakes);

  // Track score changes → score pop + shake on death
  useEffect(() => {
    if (!prevSnakes || prevSnakes.length === 0) return;
    const prevMap = new Map(prevSnakes.map((s) => [s.playerId, s]));
    snakes.forEach((s) => {
      const prev = prevMap.get(s.playerId);
      if (!prev) return;
      if (s.score > prev.score && s.body[0]) {
        const head = s.body[0];
        setScorePopId((n) => n + 1);
        setScorePops((prev) => [
          ...prev.slice(-8),
          {
            id: Date.now() + Math.random(),
            x: head.x,
            y: head.y,
            amount: s.score - prev.length,
          },
        ]);
      }
      if (prev.alive && !s.alive) {
        setShake((n) => n + 1);
      }
    });
  }, [snakes, prevSnakes]);

  // Clean up expired score pops
  useEffect(() => {
    if (scorePops.length === 0) return;
    const id = setTimeout(() => setScorePops((p) => p.slice(1)), 1100);
    return () => clearTimeout(id);
  }, [scorePops]);

  // Track my direction for pad highlight
  useEffect(() => {
    if (!currentUserId) return;
    const me = snakes.find((s) => s.playerId === currentUserId);
    if (me?.direction) setActiveDir(me.direction as Dir);
  }, [snakes, currentUserId]);

  // Cell size responsive to board wrapper
  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const side = Math.min(rect.width, rect.height || rect.width);
      const next = Math.max(6, Math.floor(side / gridWidth));
      setCellSize(next);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [gridWidth]);

  // Keyboard controls
  useEffect(() => {
    if (disabled) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      const map: Record<string, Dir> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      };
      const dir = map[e.key] || map[e.key.toLowerCase()];
      if (dir) {
        e.preventDefault();
        setActiveDir(dir);
        onMove?.(dir);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, onMove]);

  const handleToggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => undefined);
    } else {
      el.requestFullscreen?.().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const connectionOn = latency > 0 && latency < 999;

  // Ambient particles (memoized positions)
  const ambientParticles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        top: `${(i * 37) % 92 + 3}%`,
        left: `${(i * 53) % 94 + 3}%`,
        delay: `${(i * 0.7) % 8}s`,
        color: i % 3 === 0 ? '#00FF88' : i % 3 === 1 ? '#00D4FF' : '#6C5CE7',
      })),
    []
  );

  const ambientStreaks = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, i) => ({
        top: `${18 + i * 30}%`,
        delay: `${i * 2.6}s`,
      })),
    []
  );

  const gameOverWinner = useMemo(() => {
    if (gameStatus !== 'finished') return null;
    const alive = snakes.filter((s) => s.alive);
    if (alive.length === 1) return alive[0];
    const sorted = [...snakes].sort((a, b) => b.score - a.score);
    return sorted[0] || null;
  }, [gameStatus, snakes]);

  const gameOverIsMe = gameOverWinner && currentUserId && gameOverWinner.playerId === currentUserId;

  const boardSide = cellSize * gridWidth;

  return (
    <div ref={containerRef} className="snake-root">
      <div className="snake-bg" aria-hidden>
        {ambientParticles.map((p, i) => (
          <span
            key={`p-${i}`}
            className="snake-bg-particle"
            style={{
              top: p.top,
              left: p.left,
              animationDelay: p.delay,
              color: p.color,
            }}
          />
        ))}
        {ambientStreaks.map((s, i) => (
          <span
            key={`s-${i}`}
            className="snake-bg-streak"
            style={{ top: s.top, animationDelay: s.delay }}
          />
        ))}
      </div>

      <div className="snake-shell space-y-4">
        <SnakeHeader
          roomId={roomId}
          playersCount={players.length + spectators.length}
          latency={latency}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn((v) => !v)}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
          onOpenSettings={() => setShowSettings((v) => !v)}
          onLeave={onLeave}
          currentUsername={currentUsername}
          currentAvatar={playersMeta.get(currentUserId || '')?.avatar}
          connectionOn={connectionOn}
        />

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="snake-panel px-4 py-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="snake-panel-title">Audio</p>
                <button
                  type="button"
                  className="snake-icon-btn"
                  aria-label="Toggle mute"
                  onClick={() => setSoundOn((v) => !v)}
                >
                  {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-white/60">Music</span>
                    <span className="text-[11px] font-mono text-white/80">{musicVol}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={musicVol}
                    onChange={(e) => setMusicVol(Number(e.target.value))}
                    className="snake-slider"
                    aria-label="Music volume"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-white/60">Effects</span>
                    <span className="text-[11px] font-mono text-white/80">{sfxVol}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sfxVol}
                    onChange={(e) => setSfxVol(Number(e.target.value))}
                    className="snake-slider"
                    aria-label="Effects volume"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                <span className="text-[10px] text-white/45 uppercase tracking-wider">
                  Controls: WASD · Arrow Keys · Touch
                </span>
                {onSurrender && (
                  <button
                    type="button"
                    onClick={onSurrender}
                    className="snake-btn-ghost"
                    style={{ color: '#ffbcc9', borderColor: 'rgba(255, 77, 109, 0.35)' }}
                  >
                    Surrender
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-4">
          {/* LEFT SIDEBAR */}
          <aside className="space-y-3">
            <motion.div
              className="snake-panel p-4 snake-float"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <p className="snake-panel-title flex-1">Players</p>
                <span className="text-[10px] font-mono text-white/50">
                  {snakes.filter((s) => s.alive).length}/{snakes.length}
                </span>
              </div>
              <PlayersList
                snakes={snakes}
                playersMeta={playersMeta}
                currentUserId={currentUserId}
                rank={rank}
              />
            </motion.div>

            <motion.div
              className="snake-panel p-4"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <p className="snake-panel-title">Game Stats</p>
              </div>
              <StatsPanel
                elapsedMs={elapsedMs}
                gridWidth={gridWidth}
                gridHeight={gridHeight}
                tickRate={tickRate}
                totalFood={food.length}
                activePowerups={Object.keys(activePowerups).length}
                mode="Classic"
              />
            </motion.div>

            <motion.div
              className="snake-panel p-4"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <p className="snake-panel-title">Session Highlights</p>
              </div>
              <Achievements
                highestScore={highestScore}
                longest={longest}
                kills={0}
                wins={0}
              />
            </motion.div>
          </aside>

          {/* CENTER — GAME BOARD */}
          <div className="flex flex-col items-center gap-4 min-w-0">
            <motion.div
              className="snake-arena w-full"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="snake-arena-halo" aria-hidden />
              <div
                ref={boardWrapRef}
                className={cn('snake-board', shake > 0 && !reduce && 'snake-board-shake')}
                key={shake}
                style={
                  {
                    ['--sn-cell' as string]: `${cellSize}px`,
                    ['--sn-board-h' as string]: `${boardSide}px`,
                  } as React.CSSProperties
                }
              >
                <span className="snake-board-scanline" aria-hidden />

                {/* Food */}
                {food.map((f, i) => {
                  const isGold = (f.x + f.y) % 11 === 0 && i % 3 === 0;
                  const foodColor = isGold ? '#FFC857' : '#00FF88';
                  const foodDark = isGold ? '#a06a00' : '#009a52';
                  const foodGlow = isGold ? 'rgba(255, 200, 87, 0.7)' : 'rgba(0, 255, 136, 0.7)';
                  return (
                    <span
                      key={`f-${f.x}-${f.y}-${i}`}
                      className={cn('snake-food', isGold && 'snake-food-gold')}
                      style={
                        {
                          ['--x' as string]: `${f.x * cellSize + 2}px`,
                          ['--y' as string]: `${f.y * cellSize + 2}px`,
                          ['--food-bg' as string]: foodColor,
                          ['--food-dark' as string]: foodDark,
                          ['--food-glow' as string]: foodGlow,
                        } as React.CSSProperties
                      }
                    />
                  );
                })}

                {/* Snakes */}
                {snakes.map((snake) => {
                  const eyes = eyeOffsets(snake.direction);
                  const rot = directionAngle(snake.direction);
                  const gradient = `radial-gradient(circle at 32% 28%, ${hexToRgba('#ffffff', 0.85)} 0%, ${snake.color} 40%, ${hexToRgba(snake.color, 0.75)} 100%)`;
                  return snake.body.map((seg, i) => {
                    const isHead = i === 0;
                    const isTail = i === snake.body.length - 1 && snake.body.length > 3;
                    return (
                      <span
                        key={`${snake.playerId}-${i}`}
                        className={cn(
                          'snake-seg',
                          isHead && 'snake-seg-head',
                          isTail && 'snake-seg-tail',
                          !snake.alive && 'snake-seg-dead'
                        )}
                        style={
                          {
                            ['--x' as string]: `${seg.x * cellSize + 1}px`,
                            ['--y' as string]: `${seg.y * cellSize + 1}px`,
                            ['--seg-bg' as string]: isHead ? gradient : snake.color,
                            ['--seg-glow' as string]: hexToRgba(snake.color, isHead ? 0.7 : 0.4),
                            zIndex: isHead ? 3 : 2,
                          } as React.CSSProperties
                        }
                      >
                        {isHead && snake.alive && (
                          <span
                            style={{
                              position: 'absolute',
                              inset: 0,
                              transform: `rotate(${rot}deg)`,
                              transformOrigin: '50% 50%',
                            }}
                          >
                            <span className="snake-eye" style={{ top: eyes[0].top, left: eyes[0].left }} />
                            <span className="snake-eye" style={{ top: eyes[1].top, left: eyes[1].left }} />
                          </span>
                        )}
                      </span>
                    );
                  });
                })}

                {/* Score popups */}
                {scorePops.map((pop) => (
                  <span
                    key={`pop-${pop.id}`}
                    className="snake-score-pop"
                    style={{
                      left: `${pop.x * cellSize + cellSize / 2}px`,
                      top: `${pop.y * cellSize}px`,
                    }}
                  >
                    +10
                  </span>
                ))}

                {/* Waiting / Countdown overlay */}
                {gameStatus === 'waiting' && (
                  <div className="absolute inset-0 grid place-items-center bg-black/40 backdrop-blur-sm">
                    <div className="text-center">
                      <p className="text-white/60 text-sm tracking-widest uppercase mb-2">Standby</p>
                      <p className="text-2xl font-extrabold">Waiting for players…</p>
                    </div>
                  </div>
                )}

                {/* Game Over overlay */}
                {gameStatus === 'finished' && (
                  <div className="snake-gameover px-6 py-8 text-center">
                    {gameOverIsMe && !reduce &&
                      Array.from({ length: 24 }).map((_, i) => (
                        <span
                          key={`c-${i}`}
                          className="snake-confetti"
                          style={{
                            left: `${(i * 13) % 100}%`,
                            background:
                              i % 3 === 0
                                ? '#00FF88'
                                : i % 3 === 1
                                  ? '#00D4FF'
                                  : '#FFC857',
                            animationDelay: `${(i * 0.15) % 3}s`,
                          }}
                        />
                      ))}
                    <div className="relative z-[1] max-w-md mx-auto space-y-4">
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 text-amber-200 text-xs font-bold uppercase tracking-widest"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        {gameOverIsMe ? 'Victory' : gameOverWinner ? 'Match Over' : 'Draw'}
                      </motion.div>
                      <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl sm:text-4xl font-extrabold"
                        style={{
                          background:
                            'linear-gradient(135deg, #FFC857 0%, #00FF88 55%, #00D4FF 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {gameOverWinner
                          ? playersMeta.get(gameOverWinner.playerId)?.username ||
                            'Winner'
                          : 'Draw'}
                      </motion.h2>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="snake-stat">
                          <span className="snake-stat-label">Final Score</span>
                          <span className="snake-stat-value">{gameOverWinner?.score ?? 0}</span>
                        </div>
                        <div className="snake-stat">
                          <span className="snake-stat-label">Longest</span>
                          <span className="snake-stat-value">{longest}</span>
                        </div>
                        <div className="snake-stat">
                          <span className="snake-stat-label">Duration</span>
                          <span className="snake-stat-value">{formatDuration(elapsedMs)}</span>
                        </div>
                        <div className="snake-stat">
                          <span className="snake-stat-label">Your Score</span>
                          <span className="snake-stat-value">{myScore}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center pt-2">
                        {onPlayAgain && (
                          <button
                            type="button"
                            className="snake-btn-neon"
                            onClick={onPlayAgain}
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Play Again
                          </button>
                        )}
                        <button
                          type="button"
                          className="snake-btn-ghost"
                          onClick={() => {
                            const url = typeof window !== 'undefined' ? window.location.href : '';
                            if (navigator?.share) {
                              navigator
                                .share({
                                  title: 'Snake Multiplayer',
                                  text: 'Check out this match!',
                                  url,
                                })
                                .catch(() => undefined);
                            } else if (navigator?.clipboard) {
                              navigator.clipboard.writeText(url).catch(() => undefined);
                            }
                          }}
                        >
                          Share
                        </button>
                        {onLeave && (
                          <button type="button" className="snake-btn-ghost" onClick={onLeave}>
                            Leave
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <DirectionalPad
                onMove={(dir) => {
                  setActiveDir(dir);
                  onMove?.(dir);
                }}
                disabled={disabled || gameStatus !== 'playing'}
                activeDir={activeDir}
              />
              <div className="text-center sm:text-left space-y-1 sm:pl-2 max-w-xs">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                  Steering
                </p>
                <p className="text-xs text-white/70">
                  Use <span className="font-mono text-white">WASD</span> or{' '}
                  <span className="font-mono text-white">Arrow keys</span> — or tap the pad on
                  mobile.
                </p>
                <p className="text-[11px] text-white/45">
                  Collect glowing food to grow. Avoid walls, tails, and other snakes.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-3">
            <motion.div
              className="snake-panel p-4"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-3.5 h-3.5 text-fuchsia-300" />
                <p className="snake-panel-title">Power-ups</p>
              </div>
              <PowerupPanel activeMap={activePowerups} cooldownMap={cooldownMap} />
            </motion.div>

            <motion.div
              className="snake-panel p-4"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <ChatPanel
                messages={chatMessages}
                onSend={onSendChat}
                currentUserId={currentUserId}
                currentUsername={currentUsername}
              />
            </motion.div>

            <motion.div
              className="snake-panel p-4"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <p className="snake-panel-title">Leaderboard</p>
              </div>
              <Leaderboard snakes={snakes} playersMeta={playersMeta} />
            </motion.div>

            <motion.div
              className="snake-panel p-4"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <p className="snake-panel-title">Mini-Map</p>
              </div>
              <MiniMap
                snakes={snakes}
                food={food}
                gridWidth={gridWidth}
                gridHeight={gridHeight}
                currentUserId={currentUserId}
              />
            </motion.div>
          </aside>
        </div>

        <StatusBar
          latency={latency}
          fps={fps}
          connectionOn={connectionOn}
          roomId={roomId}
          playersCount={players.length}
        />
      </div>
    </div>
  );
}
