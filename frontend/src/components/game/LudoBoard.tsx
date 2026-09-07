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
  green: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  blue: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
};

/** Yard bounds [r0, r1, c0, c1] and centered 2×2 parking spots (1-cell margin in 6×6) */
const YARD: Record<string, { bounds: [number, number, number, number]; tokens: Array<[number, number]> }> = {
  red: { bounds: [9, 14, 0, 5], tokens: [[10, 1], [10, 4], [13, 1], [13, 4]] },
  green: { bounds: [0, 5, 0, 5], tokens: [[1, 1], [1, 4], [4, 1], [4, 4]] },
  blue: { bounds: [0, 5, 9, 14], tokens: [[1, 10], [1, 13], [4, 10], [4, 13]] },
  yellow: { bounds: [9, 14, 9, 14], tokens: [[10, 10], [10, 13], [13, 10], [13, 13]] },
};

const BOARD_COLORS = ['green', 'blue', 'red', 'yellow'] as const;

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
    fill: 'bg-[#EF3F3F]',
    soft: 'bg-[#F56B6B]',
    glow: 'shadow-[0_3px_8px_rgba(239,63,63,0.28)]',
    ring: 'ring-[#F8C4C4]',
    text: 'text-[#C42B2B]',
    gradient: 'from-[#F56B6B] via-[#EF3F3F] to-[#D63232]',
    hex: '#EF3F3F',
    base: '#EF3F3F',
    mid: '#E03535',
    dark: '#C42B2B',
    light: '#F7A0A0',
    pad: '#F7D0D0',
    padShadow: 'rgba(196, 43, 43, 0.18)',
  },
  blue: {
    fill: 'bg-[#2F8FE8]',
    soft: 'bg-[#5AA7EE]',
    glow: 'shadow-[0_3px_8px_rgba(47,143,232,0.28)]',
    ring: 'ring-[#B9D8F6]',
    text: 'text-[#1B6FC0]',
    gradient: 'from-[#5AA7EE] via-[#2F8FE8] to-[#1F7AD4]',
    hex: '#2F8FE8',
    base: '#2F8FE8',
    mid: '#1F7AD4',
    dark: '#1B6FC0',
    light: '#8FC4F3',
    pad: '#C9E3F8',
    padShadow: 'rgba(27, 111, 192, 0.18)',
  },
  green: {
    fill: 'bg-[#18B96F]',
    soft: 'bg-[#3DC887]',
    glow: 'shadow-[0_3px_8px_rgba(24,185,111,0.28)]',
    ring: 'ring-[#B6E8D0]',
    text: 'text-[#0F8F55]',
    gradient: 'from-[#3DC887] via-[#18B96F] to-[#12965A]',
    hex: '#18B96F',
    base: '#18B96F',
    mid: '#12965A',
    dark: '#0F8F55',
    light: '#7FDBB0',
    pad: '#C5EED9',
    padShadow: 'rgba(15, 143, 85, 0.18)',
  },
  yellow: {
    fill: 'bg-[#F5C928]',
    soft: 'bg-[#F7D45A]',
    glow: 'shadow-[0_3px_8px_rgba(245,201,40,0.28)]',
    ring: 'ring-[#F8E9A8]',
    text: 'text-[#C49A12]',
    gradient: 'from-[#F7D45A] via-[#F5C928] to-[#E0B61A]',
    hex: '#F5C928',
    base: '#F5C928',
    mid: '#E0B61A',
    dark: '#C49A12',
    light: '#F8E08A',
    pad: '#F8EBB8',
    padShadow: 'rgba(196, 154, 18, 0.16)',
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
  0: 'green',
  13: 'blue',
  26: 'yellow',
  39: 'red',
};

/** Start / home-lane arrows follow clockwise travel */
const HOME_ARROW: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  red: 'up',
  green: 'right',
  blue: 'down',
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

function isYardInnerCell(color: string, r: number, c: number) {
  const b = YARD[color]?.bounds;
  if (!b) return false;
  return r >= b[0] + 1 && r <= b[1] - 1 && c >= b[2] + 1 && c <= b[3] - 1;
}

function canMoveToken(token: Token, dice: number): boolean {
  if (!dice || token.status === 'finished') return false;
  if (token.status === 'home') return dice === 6;
  const steps = (token.stepsFromStart ?? 0) + dice;
  return steps <= BOARD_SIZE + HOME_STRETCH;
}

const FINISH_CELL: Record<string, [number, number]> = {
  red: [8, 7],
  green: [7, 6],
  blue: [6, 7],
  yellow: [7, 8],
};

/** Track start index per color (matches server START_POSITIONS) */
const START_BY_COLOR: Record<string, number> = {
  green: 0,
  blue: 13,
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

function BoardArrow({
  direction,
  color,
}: {
  direction: 'up' | 'down' | 'left' | 'right';
  color?: string;
}) {
  const rotation = { up: -90, right: 0, down: 90, left: 180 }[direction];
  const fill = color ? COLOR_THEME[color]?.dark || '#4b5563' : '#8b939e';
  return (
    <svg
      viewBox="0 0 24 24"
      className="absolute w-[58%] h-[58%] pointer-events-none ludo-entry-arrow"
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden
    >
      <path d="M7.2 6.2 L17.6 12 L7.2 17.8 Z" fill={fill} />
    </svg>
  );
}

function SafeStar({ tone = 'silver', color }: { tone?: 'silver' | 'color'; color?: string }) {
  const fill = tone === 'color' && color ? COLOR_THEME[color]?.dark || '#4b5563' : '#A8B0BA';
  return (
    <svg viewBox="0 0 24 24" className="ludo-safe-star" aria-hidden>
      <path
        d="M12 2.6l2.45 5.55 6.05.55-4.6 4.05 1.4 5.95L12 15.7 6.7 18.7l1.4-5.95-4.6-4.05 6.05-.55L12 2.6z"
        fill={fill}
      />
    </svg>
  );
}

/** Exact 15×15 grid spans (1-indexed CSS grid lines) so overlays never drift */
const YARD_GRID: Record<string, { column: string; row: string }> = {
  green: { column: '1 / 7', row: '1 / 7' },
  blue: { column: '10 / 16', row: '1 / 7' },
  red: { column: '1 / 7', row: '10 / 16' },
  yellow: { column: '10 / 16', row: '10 / 16' },
};

function FinishHub({ finished }: { finished: Record<string, number> }) {
  return (
    <div
      className="ludo-crystal-center pointer-events-none z-[5]"
      style={{ gridColumn: '7 / 10', gridRow: '7 / 10' }}
      aria-hidden
    >
      <div className="ludo-crystal-diamond">
        <span className="ludo-crystal-tri ludo-crystal-tri-blue" />
        <span className="ludo-crystal-tri ludo-crystal-tri-yellow" />
        <span className="ludo-crystal-tri ludo-crystal-tri-red" />
        <span className="ludo-crystal-tri ludo-crystal-tri-green" />
        {BOARD_COLORS.map((color) => (
          <span key={color} className={cn('ludo-finish-count', `ludo-finish-count-${color}`)}>
            {finished[color] || 0}
          </span>
        ))}
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
      {BOARD_COLORS.map((color) => {
        const theme = COLOR_THEME[color];
        const area = YARD_GRID[color];
        return (
          <div
            key={color}
            className={cn(
              'ludo-yard-platform',
              `ludo-yard-platform-${color}`,
              activeColor === color && 'is-active'
            )}
            style={{ gridColumn: area.column, gridRow: area.row }}
            aria-hidden
          >
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
  capturing,
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
  capturing?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
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
      layout={!reduce && !capturing}
      layoutId={reduce || capturing ? undefined : layoutId}
      whileHover={!disabled && onClick ? { scale: 1.08 } : undefined}
      whileTap={!disabled && onClick ? { scale: 0.92 } : undefined}
      animate={
        reduce
          ? { scale: selected || movable ? 1.06 : 1, opacity: 1 }
          : capturing
            ? { scale: [1, 0.55, 0.2], opacity: [1, 0.55, 0] }
            : bouncing
              ? { scale: [1, 1.12, 0.96, 1.04, 1], opacity: 1 }
              : movable
                ? { scale: selected ? 1.12 : 1.04, opacity: 1 }
                : selected
                  ? { scale: 1.12, opacity: 1 }
                  : { scale: 1, opacity: 1 }
      }
      transition={
        capturing
          ? { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
          : bouncing
            ? { duration: 0.4, ease: [0.22, 1, 0.36, 1], layout: { duration: STEP_MS / 1000 } }
            : movable || selected
              ? {
                  repeat: Infinity,
                  duration: selected ? 1.2 : 1.5,
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
        'relative flex items-center justify-center ludo-marble w-[74%] aspect-square',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-amber-400/70',
        movable && 'ludo-marble-movable',
        selected && 'ludo-marble-selected',
        capturing && 'ludo-marble-captured',
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
      <span className="ludo-marble-shadow" aria-hidden />
      {(movable || selected) && !reduce && !capturing && (
        <motion.span
          className="ludo-pawn-ring"
          style={{ borderColor: `${theme.base}aa` }}
          animate={{ opacity: [0.85, 0.3, 0.85], scale: [1, 1.18, 1] }}
          transition={{ repeat: Infinity, duration: 1.35 }}
        />
      )}
      <span className="ludo-marble-sphere">
        <span className="ludo-marble-shine" />
        <span className="ludo-marble-rim" />
      </span>
      {finished && (
        <Crown className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 text-amber-300 drop-shadow z-[4]" />
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
  const [spinKey, setSpinKey] = useState(0);
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
  const [capturing, setCapturing] = useState(false);
  const walkPlanRef = useRef<{
    sig: string;
    walks: Array<{ key: string; path: Array<[number, number]> }>;
    finishedColors: string[];
    captures: Array<{ key: string; from: [number, number] }>;
  }>({ sig: '', walks: [], finishedColors: [], captures: [] });
  const walkTimers = useRef<number[]>([]);
  const diceSettleTimer = useRef<number | null>(null);
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
    const captures: Array<{ key: string; from: [number, number] }> = [];
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
        if (prev.token.status === 'active' && token.status === 'home') {
          const from = tokenCell(player.color, prev.token);
          if (from) captures.push({ key, from });
          continue;
        }
        const path = buildWalkPath(player.color, token.id, prev.token, token);
        if (path.length) walks.push({ key, path });
      }
    }

    walkPlanRef.current = { sig: tokenSig, walks, finishedColors, captures };
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

  const captureCells = useMemo(() => {
    const map = new Map<string, [number, number]>();
    if (reduce || !capturing || !walkPlan.captures.length) return map;
    for (const c of walkPlan.captures) map.set(c.key, c.from);
    return map;
  }, [walkPlan, capturing, reduce]);

  useEffect(() => {
    const keyChanged = rollKey !== undefined && rollKey !== prevRollKey.current;
    const diceChanged = Boolean(state.lastDice) && state.lastDice !== prevDice.current;
    const tokensSame = tokenSig === prevTokenSig.current || !prevTokenSig.current;
    const isNewRoll = Boolean(state.lastDice) && (diceChanged || (keyChanged && tokensSame));

    prevDice.current = state.lastDice;
    prevRollKey.current = rollKey;
    prevTokenSig.current = tokenSig;

    if (!isNewRoll) return;

    const result = state.lastDice;
    setDisplayDice(result);
    setBurst(false);
    setSpinKey((k) => k + 1);
    playDiceSfx('roll');

    if (diceSettleTimer.current) {
      window.clearTimeout(diceSettleTimer.current);
      diceSettleTimer.current = null;
    }

    if (reduce) {
      setDiceAnim('idle');
      setBurst(true);
      playDiceSfx('land');
      const t = window.setTimeout(() => setBurst(false), 400);
      return () => clearTimeout(t);
    }

    setDiceAnim('settling');
    diceSettleTimer.current = window.setTimeout(() => {
      setDiceAnim('idle');
      setBurst(true);
      playDiceSfx('land');
      window.setTimeout(() => setBurst(false), 650);
      diceSettleTimer.current = null;
    }, 1050);
  }, [state.lastDice, rollKey, tokenSig, reduce]);

  useEffect(
    () => () => {
      if (diceSettleTimer.current) window.clearTimeout(diceSettleTimer.current);
    },
    []
  );

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

    const { walks, finishedColors, captures } = walkPlanRef.current;
    const captureMs = reduce ? 0 : captures.length ? 380 : 0;

    if (captureMs) {
      setCapturing(true);
      walkTimers.current.push(window.setTimeout(() => setCapturing(false), captureMs));
    } else {
      setCapturing(false);
    }

    if (reduce || walks.length === 0) {
      setWalking(false);
      setWalkStep(0);
      walkTimers.current.push(
        window.setTimeout(() => {
          walkPlanRef.current = { sig: tokenSig, walks: [], finishedColors: [], captures: [] };
          commitSnapshot();
          if (finishedColors.length) {
            setWinEffect(finishedColors[0]);
            playDiceSfx('win');
            window.setTimeout(() => setWinEffect(null), 2500);
          }
        }, captureMs)
      );
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
        walkPlanRef.current = { sig: tokenSig, walks: [], finishedColors: [], captures: [] };
        setWalking(false);
        setWalkStep(0);
        setCapturing(false);
        commitSnapshot();
        setBounceKeys(new Set(walks.map((w) => w.key)));
        playDiceSfx('land');
        window.setTimeout(() => setBounceKeys(new Set()), 480);
        if (finishedColors.length) {
          setWinEffect(finishedColors[0]);
          playDiceSfx('win');
          window.setTimeout(() => setWinEffect(null), 2500);
        }
      }, Math.max(maxSteps * STEP_MS, captureMs))
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
  const canRoll = Boolean(isMyTurn && !disabled && !mustMove && !rolling && !walking && !capturing);
  const canSelect = Boolean(isMyTurn && !disabled && mustMove && !rolling && !walking && !capturing && dice);

  const movableIds = useMemo(() => {
    if (!canSelect || !myPlayer) return new Set<number>();
    return new Set(myPlayer.tokens.filter((t) => canMoveToken(t, dice)).map((t) => t.id));
  }, [canSelect, myPlayer, dice]);

  const finishedCounts = useMemo(() => {
    const counts: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
    for (const player of state.players || []) {
      counts[player.color] = player.tokens.filter((t) => t.status === 'finished').length;
    }
    return counts;
  }, [state.players]);

  const tokenMap = useMemo(() => {
    const map = new Map<string, Array<{ player: LudoPlayer; token: Token; capturing?: boolean }>>();
    for (const player of state.players || []) {
      for (const token of player.tokens || []) {
        const pieceKey = `${player.playerId}-${token.id}`;
        const isCapturing = captureCells.has(pieceKey);
        if (token.status === 'finished' && !walkCells.has(pieceKey)) continue;
        const cell = walkCells.get(pieceKey) ?? captureCells.get(pieceKey) ?? tokenCell(player.color, token);
        if (!cell) continue;
        const key = cellKey(cell[0], cell[1]);
        const list = map.get(key) || [];
        const displayToken =
          walkCells.has(pieceKey) || isCapturing ? { ...token, status: 'active' as const } : token;
        list.push({ player, token: displayToken, capturing: isCapturing });
        map.set(key, list);
      }
    }
    return map;
  }, [state.players, walkCells, captureCells]);

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

  const orderedPlayers = useMemo(() => {
    const list = [...(state.players || [])];
    return BOARD_COLORS.map((color) => list.find((p) => p.color === color)).filter(Boolean) as LudoPlayer[];
  }, [state.players]);

  return (
    <div className="ludo-aaa-wrapper w-full max-w-[700px] mx-auto space-y-3 sm:space-y-4">
      {orderedPlayers.length > 0 && (
        <div className="ludo-player-strip">
          {orderedPlayers.map((player) => {
            const theme = COLOR_THEME[player.color] || COLOR_THEME.red;
            const finished = player.tokens.filter((t) => t.status === 'finished').length;
            const isMe = myPlayer?.playerId === player.playerId;
            const isActive = activeTurnColor === player.color;
            return (
              <div
                key={player.playerId}
                className={cn('ludo-player-chip', isActive && 'is-active')}
              >
                <span className={cn('ludo-player-dot', theme.fill)} />
                <span className="ludo-player-chip-name">
                  {isMe ? 'You' : nameFor(player.playerId)}
                </span>
                <span className="ludo-player-chip-count">{finished}/4</span>
              </div>
            );
          })}
        </div>
      )}

      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="ludo-aaa-stage relative mx-auto w-full aspect-square max-w-[640px] z-10"
      >
        <div className="ludo-aaa-float is-static" aria-hidden={false}>
          <div className="ludo-aaa-board-shadow" aria-hidden />
          <div className="ludo-aaa-board-shell">
            <div className="ludo-aaa-wood-bevel" aria-hidden />
            <div className="ludo-aaa-surface">
              <LayoutGroup id="ludo-tokens">
              <div
                className="ludo-aaa-grid relative z-[2] grid w-full h-full"
                style={{ gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)' }}
                role="grid"
                aria-label="Ludo board"
              >
                <div
                  className="ludo-aaa-grid ludo-aaa-overlay pointer-events-none absolute inset-0 z-[1] grid"
                  style={{ gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)' }}
                  aria-hidden
                >
                  <YardPlatforms activeColor={activeTurnColor} reduce={reduce} />
                  <FinishHub finished={finishedCounts} />
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
                  const yardInner = yardColor ? isYardInnerCell(yardColor, r, c) : false;
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
                        yardColor && !yardInner && `ludo-yard-outer ludo-yard-outer-${yardColor}`,
                        yardColor && yardInner && `ludo-yard-inner-cell ludo-yard-inner-${yardColor}`,
                        !underCrystal && stretchColor && `ludo-stretch ludo-stretch-${stretchColor}`,
                        isPathTile && !startColor && 'ludo-path-cell',
                        !underCrystal && onTrack && startColor && `ludo-start-square ludo-start-${startColor}`,
                        underCrystal && 'ludo-center-bg',
                        !underCrystal && isSafe && !startColor && 'ludo-safe-cell',
                        hasMoveTarget && 'ludo-move-target'
                      )}
                    >
                      {isTokenSlot && yardColor && (
                        <span
                          className={cn('ludo-token-slot', `ludo-token-slot-${yardColor}`)}
                          aria-hidden
                        />
                      )}

                      {isSafe && !underCrystal && !pieces.length && !startColor && (
                        <SafeStar tone="silver" />
                      )}

                      {startColor && !underCrystal && !pieces.length && (
                        <>
                          <SafeStar tone="color" color={startColor} />
                          <BoardArrow direction={HOME_ARROW[startColor]} color={startColor} />
                        </>
                      )}

                      {isHomeStretchEntry && stretchColor && !underCrystal && !pieces.length && (
                        <BoardArrow direction={HOME_ARROW[stretchColor]} color={stretchColor} />
                      )}

                      {hasMoveTarget && !reduce && (
                        <motion.span
                          className="ludo-selectable-glow"
                          animate={{ scale: [1, 1.18, 1], opacity: [0.9, 0.4, 0.9] }}
                          transition={{ repeat: Infinity, duration: 1.05 }}
                        />
                      )}

                      {pieces.map(({ player, token, capturing: isCapturing }, i) => {
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
                              movable={movable && !walking && !capturing}
                              finished={token.status === 'finished' && !walkCells.has(pieceKey)}
                              bouncing={bounceKeys.has(pieceKey)}
                              capturing={isCapturing}
                              selected={selectedToken === token.id && mine}
                              disabled={disabled || !movable || walking || capturing}
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

      <div className="ludo-dice-control z-10 relative">
        <TurnBadge text={statusText} isMyTurn={Boolean(isMyTurn)} reduce={reduce} />

        <div
          className={cn(
            'ludo-dice-panel',
            isMyTurn && !rolling && 'is-my-turn',
            rolling && 'is-rolling'
          )}
        >
          <div className="ludo-dice-panel-inner">
            <div className={cn('ludo-dice-stage', burst && 'is-burst', rolling && 'is-rolling')}>
              <DiceFace value={displayDice || 1} anim={diceAnim} spinKey={spinKey} />
            </div>

            <motion.button
              type="button"
              onClick={handleRoll}
              disabled={!canRoll}
              whileHover={canRoll && !reduce ? { y: -2, scale: 1.02 } : undefined}
              whileTap={canRoll && !reduce ? { scale: 0.97 } : undefined}
              transition={{ duration: 0.2 }}
              aria-label="Roll dice"
              className={cn(
                'ludo-roll-btn',
                canRoll ? 'ludo-roll-btn-active' : 'ludo-roll-btn-disabled'
              )}
            >
              <span className="ludo-roll-btn-label">
                {rolling ? 'Rolling...' : 'Roll Dice'}
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
