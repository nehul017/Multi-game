'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { toId } from '@/lib/id';
import { cn } from '@/lib/utils';

interface Token {
  id: number;
  position: number;
  status: 'home' | 'active' | 'finished';
  stepsFromStart?: number;
}

interface LudoPlayer {
  playerId: string;
  color: string;
  tokens: Token[];
  startPosition?: number;
}

interface LudoState {
  players: LudoPlayer[];
  lastDice: number;
  hasRolled?: boolean;
  safePositions?: number[];
}

export interface LudoBoardProps {
  board?: unknown;
  disabled?: boolean;
  isMyTurn?: boolean;
  onRoll?: () => void;
  onMoveToken?: (tokenId: number) => void;
  playersMeta?: Array<{ userId: string; username: string }>;
  currentUserId?: string;
  /** Whose turn it is — used only for yard glow (visual) */
  turnPlayerId?: string;
  turnPhase?: 'waiting' | 'your-turn' | 'rolling' | 'moving' | 'opponent';
  /** Changes whenever a new dice roll is committed (e.g. moveCount) */
  rollKey?: number | string;
}

const BOARD_SIZE = 52;
const HOME_STRETCH = 6;

/** Classic 15×15 track: position → [row, col] */
const TRACK: Array<[number, number]> = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0],
];

const HOME_STRETCH_CELLS: Record<string, Array<[number, number]>> = {
  red: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  blue: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
};

/** Yard bounds [r0, r1, c0, c1] and centered 2×2 parking spots (1-cell margin in 6×6) */
const YARD: Record<string, { bounds: [number, number, number, number]; tokens: Array<[number, number]> }> = {
  red: { bounds: [9, 14, 0, 5], tokens: [[10, 1], [10, 4], [13, 1], [13, 4]] },
  blue: { bounds: [0, 5, 0, 5], tokens: [[1, 1], [1, 4], [4, 1], [4, 4]] },
  green: { bounds: [0, 5, 9, 14], tokens: [[1, 10], [1, 13], [4, 10], [4, 13]] },
  yellow: { bounds: [9, 14, 9, 14], tokens: [[10, 10], [10, 13], [13, 10], [13, 13]] },
};

const COLOR_THEME: Record<
  string,
  {
    fill: string;
    soft: string;
    glow: string;
    ring: string;
    text: string;
    gradient: string;
    hex: string;
    base: string;
    dark: string;
    light: string;
    mid: string;
    /** Soft pastel pad inside home base (Ludo King style) */
    pad: string;
    padShadow: string;
  }
> = {
  red: {
    fill: 'bg-[#D32F2F]',
    soft: 'bg-[#EF5350]',
    glow: 'shadow-[0_4px_14px_rgba(244,67,54,0.45)]',
    ring: 'ring-[#FFCDD2]',
    text: 'text-[#C62828]',
    gradient: 'from-[#F44336] via-[#E53935] to-[#D32F2F]',
    hex: '#F44336',
    base: '#F44336',
    mid: '#E53935',
    dark: '#C62828',
    light: '#FF8A80',
    pad: '#F8C9C9',
    padShadow: 'rgba(183, 28, 28, 0.22)',
  },
  blue: {
    fill: 'bg-[#1565C0]',
    soft: 'bg-[#42A5F5]',
    glow: 'shadow-[0_4px_14px_rgba(30,136,229,0.45)]',
    ring: 'ring-[#BBDEFB]',
    text: 'text-[#0D47A1]',
    gradient: 'from-[#1E88E5] via-[#1976D2] to-[#1565C0]',
    hex: '#1E88E5',
    base: '#1E88E5',
    mid: '#1976D2',
    dark: '#0D47A1',
    light: '#64B5F6',
    pad: '#BBDEFB',
    padShadow: 'rgba(13, 71, 161, 0.22)',
  },
  green: {
    fill: 'bg-[#2E7D32]',
    soft: 'bg-[#66BB6A]',
    glow: 'shadow-[0_4px_14px_rgba(67,160,71,0.45)]',
    ring: 'ring-[#C8E6C9]',
    text: 'text-[#1B5E20]',
    gradient: 'from-[#43A047] via-[#388E3C] to-[#2E7D32]',
    hex: '#43A047',
    base: '#43A047',
    mid: '#388E3C',
    dark: '#1B5E20',
    light: '#81C784',
    pad: '#C8E6C9',
    padShadow: 'rgba(27, 94, 32, 0.22)',
  },
  yellow: {
    fill: 'bg-[#F9A825]',
    soft: 'bg-[#FFEE58]',
    glow: 'shadow-[0_4px_14px_rgba(251,192,45,0.45)]',
    ring: 'ring-[#FFF9C4]',
    text: 'text-[#F57F17]',
    gradient: 'from-[#FFD54F] via-[#FFCA28] to-[#FBC02D]',
    hex: '#FFD54F',
    base: '#FFD54F',
    mid: '#FFCA28',
    dark: '#F9A825',
    light: '#FFECB3',
    pad: '#FFF3C4',
    padShadow: 'rgba(245, 127, 23, 0.2)',
  },
};

const DICE_FACES: Record<number, Array<[number, number]>> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

/** Track index → player color for colored entry squares (must match server START_POSITIONS) */
const START_COLOR_BY_INDEX: Record<number, string> = {
  0: 'blue', // left start
  13: 'green', // top start
  26: 'yellow', // right start
  39: 'red', // bottom start
};

/** First home-stretch cell → arrow direction */
const HOME_ARROW: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  red: 'up',
  blue: 'right',
  green: 'down',
  yellow: 'left',
};

function isYardTokenSlot(color: string, r: number, c: number) {
  return YARD[color]?.tokens.some(([tr, tc]) => tr === r && tc === c) ?? false;
}

function cellKey(r: number, c: number) {
  return `${r}-${c}`;
}

function inYard(color: string, r: number, c: number) {
  const b = YARD[color]?.bounds;
  if (!b) return false;
  return r >= b[0] && r <= b[1] && c >= b[2] && c <= b[3];
}

function yardColorAt(r: number, c: number): string | undefined {
  return (['red', 'blue', 'green', 'yellow'] as const).find((col) => inYard(col, r, c));
}

function canMoveToken(token: Token, dice: number): boolean {
  if (!dice || token.status === 'finished') return false;
  if (token.status === 'home') return dice === 6;
  const steps = (token.stepsFromStart ?? 0) + dice;
  return steps <= BOARD_SIZE + HOME_STRETCH;
}

const FINISH_CELL: Record<string, [number, number]> = {
  red: [8, 7],
  blue: [7, 6],
  green: [6, 7],
  yellow: [7, 8],
};

/** Track start index per color (matches server START_POSITIONS) */
const START_BY_COLOR: Record<string, number> = {
  blue: 0,
  green: 13,
  yellow: 26,
  red: 39,
};

const STEP_MS = 420;

function tokenCell(color: string, token: Token): [number, number] | null {
  if (token.status === 'home') {
    return YARD[color]?.tokens[token.id] ?? null;
  }
  if (token.status === 'finished') {
    return FINISH_CELL[color] ?? [7, 7];
  }
  const steps = token.stepsFromStart ?? 0;
  if (steps >= BOARD_SIZE) {
    const idx = Math.min(HOME_STRETCH - 1, steps - BOARD_SIZE);
    return HOME_STRETCH_CELLS[color]?.[idx] ?? null;
  }
  if (token.position >= 0 && token.position < TRACK.length) {
    return TRACK[token.position];
  }
  return null;
}

/** Board cell for a given progress along that color's route */
function cellAtSteps(color: string, steps: number): [number, number] | null {
  if (steps >= BOARD_SIZE + HOME_STRETCH) return FINISH_CELL[color] ?? [7, 7];
  if (steps >= BOARD_SIZE) {
    return HOME_STRETCH_CELLS[color]?.[steps - BOARD_SIZE] ?? null;
  }
  const start = START_BY_COLOR[color];
  if (start === undefined) return null;
  return TRACK[(start + steps) % BOARD_SIZE] ?? null;
}

/** Cells to visit one-by-one from previous token state → new server state */
function buildWalkPath(color: string, _tokenId: number, prev: Token, next: Token): Array<[number, number]> {
  // Exit home on a 6 — hop onto the start square
  if (prev.status === 'home' && next.status === 'active') {
    const start = tokenCell(color, next);
    return start ? [start] : [];
  }

  // Sent home (capture) — snap, no walk
  if (prev.status === 'active' && next.status === 'home') {
    return [];
  }

  // Advance on track / home stretch / finish
  if (prev.status === 'active' && (next.status === 'active' || next.status === 'finished')) {
    const fromSteps = prev.stepsFromStart ?? 0;
    const toSteps =
      next.status === 'finished'
        ? BOARD_SIZE + HOME_STRETCH
        : (next.stepsFromStart ?? 0);
    if (toSteps <= fromSteps) return [];

    const cells: Array<[number, number]> = [];
    for (let s = fromSteps + 1; s <= toSteps; s++) {
      const cell = cellAtSteps(color, s);
      if (cell) cells.push(cell);
    }
    return cells;
  }

  return [];
}

/** Presentation tilt that keeps face N clearly on the front camera plane */
const DICE_SETTLE: Record<number, { rx: number; ry: number; rz: number }> = {
  1: { rx: -22, ry: 28, rz: 0 },
  2: { rx: -112, ry: 22, rz: 0 },
  3: { rx: -22, ry: -62, rz: 0 },
  4: { rx: -22, ry: 118, rz: 0 },
  5: { rx: 68, ry: 22, rz: 0 },
  6: { rx: -22, ry: 208, rz: 0 },
};

type DiceSfx = 'roll' | 'land' | 'capture' | 'win';

/** Prepared hooks for future audio — no assets wired yet */
function playDiceSfx(_name: DiceSfx) {
  // Intentionally empty until sound assets / settings are connected
}

type DiceAnim = 'idle' | 'spinning' | 'settling';

function DicePips({ value }: { value: number }) {
  const pips = DICE_FACES[value] || DICE_FACES[1];
  return (
    <div className="ludo-dice-pips" aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => {
        const r = Math.floor(i / 3);
        const c = i % 3;
        const on = pips.some(([pr, pc]) => pr === r && pc === c);
        return <span key={i} className={cn('ludo-dice-pip', on && 'ludo-dice-pip-on')} />;
      })}
    </div>
  );
}

function DiceFace({
  value,
  anim,
  spinKey,
}: {
  value: number;
  anim: DiceAnim;
  /** Changes each settle so CSS animation restarts with fresh random spins */
  spinKey: number;
}) {
  const face = Math.min(6, Math.max(1, value || 1));
  const settle = DICE_SETTLE[face];

  // Stable per-roll spin targets (degrees) — avoids re-render churn mid-animation
  const spins = useMemo(() => {
    const n = spinKey || 1;
    const rand = (offset: number, span: number) => 720 + ((n * offset) % span);
    return {
      x: `${rand(17, 720)}deg`,
      y: `${rand(41, 840)}deg`,
      z: `${360 + ((n * 13) % 360)}deg`,
    };
  }, [spinKey]);

  const style = {
    '--rx': `${settle.rx}deg`,
    '--ry': `${settle.ry}deg`,
    '--rz': `${settle.rz}deg`,
    '--spin-x': spins.x,
    '--spin-y': spins.y,
    '--spin-z': spins.z,
  } as CSSProperties;

  const active = anim === 'spinning' || anim === 'settling';

  return (
    <div className={cn('ludo-dice-rig', active && 'is-active')} style={style}>
      <div
        className={cn(
          'ludo-dice-scene',
          anim === 'spinning' && 'is-spinning',
          anim === 'settling' && 'is-settling'
        )}
        aria-hidden
      >
        <div
          key={anim === 'settling' ? `settle-${spinKey}-${face}` : 'cube'}
          className={cn(
            'ludo-dice-cube',
            anim === 'spinning' && 'is-spinning',
            anim === 'settling' && 'is-settling'
          )}
        >
          <div className="ludo-dice-core" />
          <div className="ludo-dice-face ludo-dice-face-1"><DicePips value={1} /></div>
          <div className="ludo-dice-face ludo-dice-face-2"><DicePips value={2} /></div>
          <div className="ludo-dice-face ludo-dice-face-3"><DicePips value={3} /></div>
          <div className="ludo-dice-face ludo-dice-face-4"><DicePips value={4} /></div>
          <div className="ludo-dice-face ludo-dice-face-5"><DicePips value={5} /></div>
          <div className="ludo-dice-face ludo-dice-face-6"><DicePips value={6} /></div>
        </div>
      </div>
      <div className="ludo-dice-ring" aria-hidden />
      <div className="ludo-dice-shadow" aria-hidden />
    </div>
  );
}

function EntryArrow({ direction }: { direction: 'up' | 'down' | 'left' | 'right' }) {
  const rotation = { up: 0, right: 90, down: 180, left: 270 }[direction];
  return (
    <svg
      viewBox="0 0 24 24"
      className="absolute w-[52%] h-[52%] pointer-events-none ludo-entry-arrow"
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`arrow-grad-${direction}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
        </linearGradient>
      </defs>
      <path
        d="M12 3.5 C12 3.5 7.5 10.5 7.5 14.5 C7.5 17 9.5 19 12 19 C14.5 19 16.5 17 16.5 14.5 C16.5 10.5 12 3.5 12 3.5 Z"
        fill={`url(#arrow-grad-${direction})`}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="0.6"
      />
    </svg>
  );
}

function SafeStar() {
  return (
    <svg viewBox="0 0 24 24" className="ludo-safe-star" aria-hidden>
      <defs>
        <linearGradient id="ludo-gold-star" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF8E1" />
          <stop offset="35%" stopColor="#FFD54F" />
          <stop offset="70%" stopColor="#FFB300" />
          <stop offset="100%" stopColor="#FF8F00" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.2l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 16.6 6.2 19.8l1.5-6.5-5-4.4 6.6-.6L12 2.2z"
        fill="url(#ludo-gold-star)"
        stroke="rgba(183,110,0,0.55)"
        strokeWidth="0.7"
      />
    </svg>
  );
}

/** Exact 15×15 grid spans (1-indexed CSS grid lines) so overlays never drift */
const YARD_GRID: Record<string, { column: string; row: string }> = {
  blue: { column: '1 / 7', row: '1 / 7' },
  green: { column: '10 / 16', row: '1 / 7' },
  red: { column: '1 / 7', row: '10 / 16' },
  yellow: { column: '10 / 16', row: '10 / 16' },
};

function CrystalCenter() {
  return (
    <div
      className="ludo-crystal-center pointer-events-none z-[5]"
      style={{ gridColumn: '7 / 10', gridRow: '7 / 10' }}
      aria-hidden
    >
      <span className="ludo-crystal-glow-ring" />
      <div className="ludo-crystal-diamond">
        <span className="ludo-crystal-tri ludo-crystal-tri-green" />
        <span className="ludo-crystal-tri ludo-crystal-tri-yellow" />
        <span className="ludo-crystal-tri ludo-crystal-tri-red" />
        <span className="ludo-crystal-tri ludo-crystal-tri-blue" />
        <span className="ludo-crystal-glass" />
      </div>
    </div>
  );
}

function YardPlatforms({
  activeColor,
  reduce,
}: {
  activeColor?: string;
  reduce: boolean | null;
}) {
  return (
    <>
      {(['blue', 'green', 'red', 'yellow'] as const).map((color) => {
        const theme = COLOR_THEME[color];
        const area = YARD_GRID[color];
        return (
          <div
            key={color}
            className={cn(
              'ludo-yard-platform',
              `ludo-yard-platform-${color}`,
              activeColor === color && 'is-active',
              activeColor && activeColor !== color && 'is-dimmed'
            )}
            style={{ gridColumn: area.column, gridRow: area.row }}
            aria-hidden
          >
            <span className="ludo-yard-bevel" />
            <div
              className="ludo-yard-inset"
              style={
                {
                  '--yard-pad': theme.pad,
                  '--yard-pad-shadow': theme.padShadow,
                } as CSSProperties
              }
            />
            {!reduce && activeColor === color && <span className="ludo-yard-platform-pulse" />}
          </div>
        );
      })}
    </>
  );
}

function TokenPiece({
  color,
  selected,
  movable,
  finished,
  bouncing,
  atHome,
  onClick,
  disabled,
  label,
  layoutId,
}: {
  color: string;
  selected?: boolean;
  movable?: boolean;
  finished?: boolean;
  bouncing?: boolean;
  /** Home-base marble style (Ludo King reference) */
  atHome?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  /** Stable id so the piece FLIPs cell-to-cell while walking */
  layoutId?: string;
}) {
  const theme = COLOR_THEME[color] || COLOR_THEME.red;
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled || !onClick}
      onClick={onClick}
      layout={!reduce}
      layoutId={reduce ? undefined : layoutId}
      whileHover={!disabled && onClick ? { scale: 1.12, y: -3 } : undefined}
      whileTap={!disabled && onClick ? { scale: 0.9, y: 2 } : undefined}
      animate={
        reduce
          ? { y: 0, scale: selected || movable ? 1.06 : 1 }
          : bouncing
            ? { y: [0, -10, 0, -4, 0], scale: [1, 1.12, 0.96, 1.05, 1] }
            : movable
              ? { y: [0, -4, 0], scale: selected ? 1.1 : 1.05 }
              : selected
                ? { y: [0, -3, 0], scale: 1.1 }
                : { y: 0, scale: 1 }
      }
      transition={
        bouncing
          ? { duration: 0.45, ease: [0.22, 1, 0.36, 1], layout: { duration: STEP_MS / 1000 } }
          : movable || selected
            ? {
                repeat: Infinity,
                duration: selected ? 1.1 : 1.35,
                ease: 'easeInOut',
                layout: { type: 'spring', stiffness: 520, damping: 34, mass: 0.65 },
              }
            : {
                type: 'spring',
                stiffness: 420,
                damping: 22,
                layout: { type: 'spring', stiffness: 520, damping: 34, mass: 0.65 },
              }
      }
      className={cn(
        'relative flex items-center justify-center',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-amber-400/70',
        atHome ? 'ludo-marble w-[78%] aspect-square' : 'ludo-pawn w-[78%] h-[92%] flex-col justify-end',
        movable && (atHome ? 'ludo-marble-movable' : 'ludo-pawn-movable'),
        selected && (atHome ? 'ludo-marble-selected' : 'ludo-pawn-selected'),
        finished && 'ludo-pawn-finished',
        (disabled || !onClick) && 'cursor-default'
      )}
      style={
        {
          '--pawn-base': theme.base,
          '--pawn-mid': theme.mid,
          '--pawn-dark': theme.dark,
          '--pawn-light': theme.light,
        } as CSSProperties
      }
    >
      {atHome ? (
        <>
          <span className="ludo-marble-shadow" aria-hidden />
          {(movable || selected) && !reduce && (
            <motion.span
              className="ludo-pawn-ring"
              style={{ borderColor: `${theme.base}cc`, boxShadow: `0 0 14px ${theme.base}88` }}
              animate={{ opacity: [0.95, 0.35, 0.95], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.15 }}
            />
          )}
          <span className="ludo-marble-sphere">
            <span className="ludo-marble-shine" />
            <span className="ludo-marble-rim" />
          </span>
        </>
      ) : (
        <>
          <span className="ludo-pawn-shadow" aria-hidden />
          {(movable || selected) && !reduce && (
            <motion.span
              className="ludo-pawn-ring"
              style={{ borderColor: `${theme.base}cc`, boxShadow: `0 0 14px ${theme.base}88` }}
              animate={{ opacity: [0.95, 0.35, 0.95], scale: [1, 1.22, 1] }}
              transition={{ repeat: Infinity, duration: 1.15 }}
            />
          )}
          <span className="ludo-pawn-head">
            <span className="ludo-pawn-gloss" />
          </span>
          <span className="ludo-pawn-neck" />
          <span className="ludo-pawn-body" />
          <span className="ludo-pawn-base" />
          {finished && (
            <Crown className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 text-amber-300 drop-shadow z-[4]" />
          )}
        </>
      )}
    </motion.button>
  );
}

function TurnBadge({ text, isMyTurn, reduce }: { text: string; isMyTurn?: boolean; reduce: boolean | null }) {
  return (
    <div className={cn('ludo-turn-banner', isMyTurn && 'is-mine')}>
      {isMyTurn && !reduce && <span className="ludo-turn-dot" aria-hidden />}
      <AnimatePresence mode="wait">
        <motion.span
          key={text}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className={cn(
            'ludo-turn-banner-text',
            isMyTurn ? 'ludo-gradient-text' : 'text-theme-secondary'
          )}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function LudoBoard({
  board,
  disabled,
  isMyTurn,
  onRoll,
  onMoveToken,
  playersMeta,
  currentUserId,
  turnPlayerId,
  turnPhase,
  rollKey,
}: LudoBoardProps) {
  const state = (board || { players: [], lastDice: 0 }) as LudoState;
  const reduce = useReducedMotion();
  const [diceAnim, setDiceAnim] = useState<DiceAnim>('idle');
  const [displayDice, setDisplayDice] = useState(state.lastDice || 1);
  /** LAST readout — only updates after the settle animation finishes */
  const [revealedDice, setRevealedDice] = useState(state.lastDice || 0);
  const [spinKey, setSpinKey] = useState(0);
  const [rollHistory, setRollHistory] = useState<number[]>([]);
  const [burst, setBurst] = useState(false);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [winEffect, setWinEffect] = useState<string | null>(null);
  const [bounceKeys, setBounceKeys] = useState<Set<string>>(new Set());
  /** Index into each walk path (0 = first step after leave) */
  const [walkStep, setWalkStep] = useState(0);
  const [walking, setWalking] = useState(false);
  const prevDice = useRef(state.lastDice);
  const prevRollKey = useRef(rollKey);
  const prevTokenSig = useRef('');
  const prevTokenSnapshot = useRef<Map<string, { color: string; token: Token }>>(new Map());
  const walkPlanRef = useRef<{
    sig: string;
    walks: Array<{ key: string; path: Array<[number, number]> }>;
    finishedColors: string[];
  }>({ sig: '', walks: [], finishedColors: [] });
  const walkTimers = useRef<number[]>([]);
  const rolling = diceAnim !== 'idle';

  const trackSet = useMemo(() => new Set(TRACK.map(([r, c]) => cellKey(r, c))), []);
  const stretchSets = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const [color, cells] of Object.entries(HOME_STRETCH_CELLS)) {
      map[color] = new Set(cells.map(([r, c]) => cellKey(r, c)));
    }
    return map;
  }, []);

  const tokenSig = useMemo(
    () =>
      (state.players || [])
        .map((p) =>
          (p.tokens || [])
            .map((t) => `${t.id}:${t.status}:${t.position}:${t.stepsFromStart ?? 0}`)
            .join(',')
        )
        .join('|'),
    [state.players]
  );

  // Build walk plan during render so the first paint never teleports to the end cell
  if (tokenSig !== walkPlanRef.current.sig) {
    const walks: Array<{ key: string; path: Array<[number, number]> }> = [];
    const finishedColors: string[] = [];
    const hadSnapshot = prevTokenSnapshot.current.size > 0;

    for (const player of state.players || []) {
      for (const token of player.tokens || []) {
        const key = `${player.playerId}-${token.id}`;
        const prev = prevTokenSnapshot.current.get(key);
        if (token.status === 'finished' && prev && prev.token.status !== 'finished') {
          finishedColors.push(player.color);
        }
        if (!hadSnapshot || !prev) continue;
        const changed =
          prev.token.status !== token.status ||
          prev.token.position !== token.position ||
          (prev.token.stepsFromStart ?? 0) !== (token.stepsFromStart ?? 0);
        if (!changed) continue;
        if (prev.token.status === 'active' && token.status === 'home') continue; // capture snap
        const path = buildWalkPath(player.color, token.id, prev.token, token);
        if (path.length) walks.push({ key, path });
      }
    }

    walkPlanRef.current = { sig: tokenSig, walks, finishedColors };
  }

  const walkPlan = walkPlanRef.current;
  const walkCells = useMemo(() => {
    const map = new Map<string, [number, number]>();
    if (reduce || !walkPlan.walks.length) return map;
    for (const w of walkPlan.walks) {
      const idx = Math.min(walkStep, w.path.length - 1);
      map.set(w.key, w.path[idx]);
    }
    return map;
  }, [walkPlan, walkStep, reduce]);

  useEffect(() => {
    const keyChanged = rollKey !== undefined && rollKey !== prevRollKey.current;
    const diceChanged = Boolean(state.lastDice) && state.lastDice !== prevDice.current;
    const tokensSame = tokenSig === prevTokenSig.current || !prevTokenSig.current;
    const isNewRoll = Boolean(state.lastDice) && (diceChanged || (keyChanged && tokensSame));

    if (isNewRoll) {
      const result = state.lastDice;
      // Lock the authoritative face immediately so settle never shows the wrong number
      setDisplayDice(result);
      setBurst(false);
      setSpinKey((k) => k + 1);
      playDiceSfx('roll');

      if (reduce) {
        setDiceAnim('idle');
        setBurst(true);
        setRevealedDice(result);
        setRollHistory((h) => [result, ...h].slice(0, 6));
        playDiceSfx('land');
        const t = window.setTimeout(() => setBurst(false), 400);
        prevDice.current = result;
        prevRollKey.current = rollKey;
        prevTokenSig.current = tokenSig;
        return () => clearTimeout(t);
      }

      setDiceAnim('settling');
      const settleMs = 1050;
      const t = window.setTimeout(() => {
        setDiceAnim('idle');
        setBurst(true);
        setRevealedDice(result);
        setRollHistory((h) => [result, ...h].slice(0, 6));
        playDiceSfx('land');
        window.setTimeout(() => setBurst(false), 650);
      }, settleMs);

      prevDice.current = result;
      prevRollKey.current = rollKey;
      prevTokenSig.current = tokenSig;
      return () => clearTimeout(t);
    }

    prevDice.current = state.lastDice;
    prevRollKey.current = rollKey;
    prevTokenSig.current = tokenSig;
  }, [state.lastDice, rollKey, tokenSig, isMyTurn, reduce]);

  // Advance walk steps; commit snapshot when the move is done (or instantly if no walk)
  useLayoutEffect(() => {
    const commitSnapshot = () => {
      const nextSnapshot = new Map<string, { color: string; token: Token }>();
      for (const player of state.players || []) {
        for (const token of player.tokens || []) {
          nextSnapshot.set(`${player.playerId}-${token.id}`, {
            color: player.color,
            token: { ...token },
          });
        }
      }
      prevTokenSnapshot.current = nextSnapshot;
    };

    walkTimers.current.forEach((id) => window.clearTimeout(id));
    walkTimers.current = [];

    const { walks, finishedColors } = walkPlanRef.current;

    if (reduce || walks.length === 0) {
      setWalking(false);
      setWalkStep(0);
      commitSnapshot();
      if (finishedColors.length) {
        setWinEffect(finishedColors[0]);
        playDiceSfx('win');
        walkTimers.current.push(window.setTimeout(() => setWinEffect(null), 2500));
      }
      return () => walkTimers.current.forEach((id) => window.clearTimeout(id));
    }

    setWalkStep(0);
    setWalking(true);

    const maxSteps = Math.max(...walks.map((w) => w.path.length));
    for (let step = 1; step < maxSteps; step++) {
      walkTimers.current.push(
        window.setTimeout(() => {
          setWalkStep(step);
          setBounceKeys(new Set(walks.filter((w) => step < w.path.length).map((w) => w.key)));
          window.setTimeout(() => setBounceKeys(new Set()), Math.min(140, STEP_MS - 40));
        }, step * STEP_MS)
      );
    }

    walkTimers.current.push(
      window.setTimeout(() => {
        // Clear plan so overrides drop; snapshot matches server board
        walkPlanRef.current = { sig: tokenSig, walks: [], finishedColors: [] };
        setWalking(false);
        setWalkStep(0);
        commitSnapshot();
        setBounceKeys(new Set(walks.map((w) => w.key)));
        playDiceSfx('land');
        window.setTimeout(() => setBounceKeys(new Set()), 480);
        if (finishedColors.length) {
          setWinEffect(finishedColors[0]);
          playDiceSfx('win');
          window.setTimeout(() => setWinEffect(null), 2500);
        }
      }, maxSteps * STEP_MS)
    );

    return () => walkTimers.current.forEach((id) => window.clearTimeout(id));
  }, [tokenSig, reduce, state.players]);

  const myPlayer = useMemo(() => {
    if (!currentUserId) return state.players?.[0];
    const me = toId(currentUserId);
    return state.players?.find((p) => toId(p.playerId) === me);
  }, [state.players, currentUserId]);

  const activeTurnColor = useMemo(() => {
    const turnId = turnPlayerId ? toId(turnPlayerId) : isMyTurn && myPlayer ? toId(myPlayer.playerId) : '';
    if (!turnId) return undefined;
    return state.players?.find((p) => toId(p.playerId) === turnId)?.color;
  }, [turnPlayerId, isMyTurn, myPlayer, state.players]);

  const dice = state.lastDice || 0;
  // Server-authoritative: after rolling, must move before rolling again
  const mustMove = Boolean(isMyTurn && state.hasRolled && dice);
  const canRoll = Boolean(isMyTurn && !disabled && !mustMove && !rolling && !walking);
  const canSelect = Boolean(isMyTurn && !disabled && mustMove && !rolling && !walking && dice);

  const movableIds = useMemo(() => {
    if (!canSelect || !myPlayer) return new Set<number>();
    return new Set(myPlayer.tokens.filter((t) => canMoveToken(t, dice)).map((t) => t.id));
  }, [canSelect, myPlayer, dice]);

  const tokenMap = useMemo(() => {
    const map = new Map<string, Array<{ player: LudoPlayer; token: Token }>>();
    for (const player of state.players || []) {
      for (const token of player.tokens || []) {
        const pieceKey = `${player.playerId}-${token.id}`;
        const cell = walkCells.get(pieceKey) ?? tokenCell(player.color, token);
        if (!cell) continue;
        const key = cellKey(cell[0], cell[1]);
        const list = map.get(key) || [];
        // While walking, show pawn style (not home marble)
        const displayToken = walkCells.has(pieceKey)
          ? { ...token, status: 'active' as const }
          : token;
        list.push({ player, token: displayToken });
        map.set(key, list);
      }
    }
    return map;
  }, [state.players, walkCells]);

  const statusText = useMemo(() => {
    if (turnPhase === 'waiting') return 'Waiting to start';
    if (rolling || turnPhase === 'rolling') return 'Rolling Dice...';
    if (walking || mustMove || turnPhase === 'moving') return 'Moving Piece...';
    if (isMyTurn || turnPhase === 'your-turn') return 'Your Turn';
    return 'Waiting...';
  }, [turnPhase, rolling, walking, isMyTurn, mustMove]);

  const handleRoll = () => {
    if (!canRoll) return;
    const diceAtClick = state.lastDice;
    setDiceAnim('spinning');
    playDiceSfx('roll');
    onRoll?.();
    window.setTimeout(() => {
      // Clear optimistic spin only if the server never confirmed a new roll
      setDiceAnim((phase) =>
        prevDice.current === diceAtClick && phase === 'spinning' ? 'idle' : phase
      );
    }, 2200);
  };

  const handleToken = (tokenId: number, playerId: string) => {
    if (!canSelect || !myPlayer || toId(playerId) !== toId(myPlayer.playerId)) return;
    if (!movableIds.has(tokenId)) return;
    setSelectedToken(tokenId);
    onMoveToken?.(tokenId);
    setTimeout(() => setSelectedToken(null), 400);
  };

  const nameFor = (playerId: string) =>
    playersMeta?.find((p) => toId(p.userId) === toId(playerId))?.username ||
    `P-${playerId.slice(-4)}`;

  return (
    <div className="ludo-aaa-wrapper w-full max-w-[620px] mx-auto space-y-4 sm:space-y-5">
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="ludo-aaa-stage relative mx-auto w-full aspect-square max-w-[540px] z-10"
      >
        <div className={cn('ludo-aaa-float', reduce && 'is-static')} aria-hidden={false}>
          <div className="ludo-aaa-board-shadow" aria-hidden />
          <div className="ludo-aaa-board-shell">
            <div className="ludo-aaa-wood-bevel" aria-hidden />
            <div className="ludo-aaa-surface">
              {/* Yards sit under the play grid; transparent yard cells let them show through */}
              <div
                className="ludo-aaa-grid ludo-aaa-overlay pointer-events-none absolute inset-0 z-[1] grid"
                style={{ gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)' }}
                aria-hidden
              >
                <YardPlatforms activeColor={activeTurnColor} reduce={reduce} />
              </div>
              <LayoutGroup id="ludo-tokens">
              <div
                className="ludo-aaa-grid relative z-[2] grid w-full h-full"
                style={{ gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)' }}
                role="grid"
                aria-label="Ludo board"
              >
                {/* Same 15×15 metrics — crystal locks to center 3×3, under tokens */}
                <div
                  className="ludo-aaa-grid ludo-aaa-overlay pointer-events-none absolute inset-0 z-[1] grid"
                  style={{ gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)' }}
                  aria-hidden
                >
                  <CrystalCenter />
                </div>
                {Array.from({ length: 225 }).map((_, idx) => {
                  const r = Math.floor(idx / 15);
                  const c = idx % 15;
                  const key = cellKey(r, c);
                  const inCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
                  const yardColor = yardColorAt(r, c);
                  const stretchColor = (['red', 'blue', 'green', 'yellow'] as const).find((col) =>
                    stretchSets[col].has(key)
                  );
                  const onTrack = trackSet.has(key);
                  const trackIndex = onTrack ? TRACK.findIndex(([tr, tc]) => tr === r && tc === c) : -1;
                  const isSafe = trackIndex >= 0 && SAFE.has(trackIndex);
                  const startColor = trackIndex >= 0 ? START_COLOR_BY_INDEX[trackIndex] : undefined;
                  const isHomeStretchEntry =
                    stretchColor &&
                    HOME_STRETCH_CELLS[stretchColor]?.[0]?.[0] === r &&
                    HOME_STRETCH_CELLS[stretchColor]?.[0]?.[1] === c;
                  const pieces = tokenMap.get(key) || [];
                  const hasMoveTarget = pieces.some(
                    ({ player, token }) =>
                      myPlayer?.playerId === player.playerId && movableIds.has(token.id)
                  );
                  const isTokenSlot = yardColor ? isYardTokenSlot(yardColor, r, c) : false;
                  // Center 3×3 is covered by the crystal overlay — keep cells clear so it shows through
                  const underCrystal = inCenter;
                  const isPathTile =
                    !underCrystal &&
                    ((onTrack && !stretchColor) ||
                      (!yardColor && !onTrack && !stretchColor));

                  return (
                    <div
                      key={key}
                      role="gridcell"
                      className={cn(
                        'ludo-aaa-cell relative z-[2] flex items-center justify-center',
                        yardColor && 'ludo-yard-cell',
                        !underCrystal && stretchColor && `ludo-stretch ludo-stretch-${stretchColor}`,
                        isPathTile && !startColor && 'ludo-path-cell',
                        !underCrystal && onTrack && startColor && `ludo-start-square ludo-start-${startColor}`,
                        underCrystal && 'ludo-center-bg',
                        !underCrystal && isSafe && 'ludo-safe-cell',
                        hasMoveTarget && 'ludo-move-target'
                      )}
                    >
                      {isTokenSlot && yardColor && (
                        <span
                          className={cn('ludo-token-slot', `ludo-token-slot-${yardColor}`)}
                          aria-hidden
                        />
                      )}

                      {isSafe && !underCrystal && !pieces.length && <SafeStar />}

                      {isHomeStretchEntry && stretchColor && !underCrystal && (
                        <EntryArrow direction={HOME_ARROW[stretchColor]} />
                      )}

                      {hasMoveTarget && !reduce && (
                        <motion.span
                          className="ludo-selectable-glow"
                          animate={{ scale: [1, 1.18, 1], opacity: [0.9, 0.4, 0.9] }}
                          transition={{ repeat: Infinity, duration: 1.05 }}
                        />
                      )}

                      {pieces.map(({ player, token }, i) => {
                        const mine = myPlayer?.playerId === player.playerId;
                        const movable = mine && movableIds.has(token.id);
                        const pieceKey = `${player.playerId}-${token.id}`;
                        return (
                          <div
                            key={pieceKey}
                            className="absolute inset-0 flex items-center justify-center"
                            style={{
                              transform:
                                pieces.length > 1
                                  ? `translate(${(i - 0.5) * 22}%, ${(i - 0.5) * 22}%) scale(0.78)`
                                  : undefined,
                              zIndex: 2 + i,
                            }}
                          >
                            <TokenPiece
                              color={player.color}
                              layoutId={`ludo-token-${pieceKey}`}
                              atHome={token.status === 'home'}
                              movable={movable && !walking}
                              finished={token.status === 'finished' && !walkCells.has(pieceKey)}
                              bouncing={bounceKeys.has(pieceKey)}
                              selected={selectedToken === token.id && mine}
                              disabled={disabled || !movable || walking}
                              onClick={
                                movable ? () => handleToken(token.id, player.playerId) : undefined
                              }
                              label={`${nameFor(player.playerId)} token ${token.id + 1}, ${token.status}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              </LayoutGroup>
              <div className="ludo-aaa-surface-sheen" aria-hidden />
            </div>
          </div>
        </div>

        {/* Win effect overlay */}
        <AnimatePresence>
          {winEffect && !reduce && (
            <motion.div
              key="win-fx"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
            >
              {Array.from({ length: 28 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${COLOR_THEME[winEffect]?.light || '#fff'} 0%, ${COLOR_THEME[winEffect]?.hex || '#fbbf24'} 70%)`,
                    boxShadow: `0 0 10px ${COLOR_THEME[winEffect]?.hex || '#fbbf24'}`,
                  }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos((i / 28) * Math.PI * 2) * (90 + (i % 5) * 14),
                    y: Math.sin((i / 28) * Math.PI * 2) * (90 + (i % 5) * 14),
                    scale: [0, 1.6, 0],
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 1.55, delay: i * 0.03 }}
                />
              ))}
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: [0, 1.45, 1], rotate: 0 }}
                transition={{ duration: 0.75 }}
                className="text-4xl drop-shadow-lg"
              >
                🏆
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Premium Dice Control */}
      <div className="ludo-dice-control z-10 relative">
        <TurnBadge text={statusText} isMyTurn={Boolean(isMyTurn)} reduce={reduce} />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={cn(
            'ludo-dice-panel',
            isMyTurn && !rolling && 'is-my-turn',
            rolling && 'is-rolling'
          )}
        >
          <div className="ludo-dice-panel-inner">
            {/* Left — Dice */}
            <div className={cn('ludo-dice-stage', burst && 'is-burst', rolling && 'is-rolling')}>
              <DiceFace value={displayDice || 1} anim={diceAnim} spinKey={spinKey} />
              <AnimatePresence>
                {burst && !reduce && (
                  <motion.div
                    key="dice-burst"
                    className="pointer-events-none absolute inset-0"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {Array.from({ length: 10 }).map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 1, scale: 0, x: '50%', y: '45%' }}
                        animate={{
                          opacity: 0,
                          scale: 1.1,
                          x: `calc(50% + ${Math.cos((i / 10) * Math.PI * 2) * 42}px)`,
                          y: `calc(45% + ${Math.sin((i / 10) * Math.PI * 2) * 42}px)`,
                        }}
                        transition={{ duration: 0.5 }}
                        className="absolute w-1.5 h-1.5 rounded-full bg-primary-400"
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Center — Last + history */}
            <div className="ludo-dice-center">
              <p className="ludo-dice-last-label">Last</p>
              <motion.p
                key={revealedDice || 'empty'}
                initial={reduce ? false : { scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="ludo-dice-last-value"
              >
                {revealedDice || '—'}
              </motion.p>
              <div className="ludo-dice-history" aria-label="Recent rolls">
                {rollHistory.length > 0
                  ? rollHistory.map((n, i) => (
                      <span
                        key={`${n}-${i}-${revealedDice}`}
                        className={cn('ludo-history-pill', i === 0 && 'is-latest')}
                      >
                        {n}
                      </span>
                    ))
                  : Array.from({ length: 6 }).map((_, i) => (
                      <span key={`empty-${i}`} className="ludo-history-pill is-empty">
                        –
                      </span>
                    ))}
              </div>
            </div>

            {/* Right — Roll */}
            <motion.button
              type="button"
              onClick={handleRoll}
              disabled={!canRoll}
              whileHover={canRoll && !reduce ? { y: -4, scale: 1.03 } : undefined}
              whileTap={canRoll && !reduce ? { scale: 0.96 } : undefined}
              transition={{ duration: 0.25 }}
              aria-label="Roll dice"
              className={cn(
                'ludo-roll-btn',
                canRoll ? 'ludo-roll-btn-active' : 'ludo-roll-btn-disabled'
              )}
            >
              {canRoll && !reduce && <span className="pointer-events-none absolute inset-0 ludo-btn-sheen" />}
              <span className="ludo-roll-btn-label">
                <span className="ludo-roll-btn-emoji" aria-hidden>
                  🎲
                </span>
                {rolling ? 'Rolling...' : 'Roll Dice'}
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Player yards summary */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 z-10 relative">
        {(state.players || []).map((player) => {
          const theme = COLOR_THEME[player.color] || COLOR_THEME.red;
          const finished = player.tokens.filter((t) => t.status === 'finished').length;
          const active = player.tokens.filter((t) => t.status === 'active').length;
          const isMe = myPlayer?.playerId === player.playerId;
          return (
            <motion.div
              key={player.playerId}
              whileHover={{ y: -3, scale: 1.01 }}
              className={cn(
                'ludo-player-card rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 transition-all',
                isMe && isMyTurn && 'ludo-player-card-active'
              )}
            >
              <motion.span
                className={cn(
                  'w-10 h-10 rounded-xl bg-gradient-to-br shadow-lg border border-white/30 flex items-center justify-center',
                  theme.gradient
                )}
                animate={isMe && isMyTurn && !reduce ? { scale: [1, 1.08, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {finished >= 4 && <Crown className="w-4 h-4 text-white" />}
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-theme-primary truncate">
                  {nameFor(player.playerId)}
                  {isMe && <span className="ml-1.5 text-[10px] text-violet-500 font-semibold">(You)</span>}
                </p>
                <p className="text-[11px] text-theme-muted font-medium">
                  {finished}/4 home · {active} active
                </p>
              </div>
              <div className="flex -space-x-1.5">
                {player.tokens.map((t) => (
                  <span
                    key={t.id}
                    className={cn(
                      'w-3 h-3 rounded-full border-2 border-white/50 transition-all',
                      t.status === 'finished'
                        ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                        : t.status === 'active'
                          ? cn(theme.fill, 'shadow-sm')
                          : 'bg-theme-muted/30'
                    )}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
