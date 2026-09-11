'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from 'framer-motion';
import { Hourglass, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTttSounds } from '@/hooks/useTttSounds';

type Cell = 'X' | 'O' | null;

export interface TicTacToeBoardProps {
  onGameEnd?: (winner: string | null) => void;
  onMove?: (position: { row: number; col: number } | number) => void;
  board?: unknown;
  disabled?: boolean;
  isMyTurn?: boolean;
  myMark?: 'X' | 'O';
}

const winLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const CELL_CENTER: Record<number, [number, number]> = {
  0: [0.5, 0.5], 1: [1.5, 0.5], 2: [2.5, 0.5],
  3: [0.5, 1.5], 4: [1.5, 1.5], 5: [2.5, 1.5],
  6: [0.5, 2.5], 7: [1.5, 2.5], 8: [2.5, 2.5],
};

function flattenBoard(board: unknown): Cell[] {
  if (!board) return Array(9).fill(null);
  if (Array.isArray(board) && board.length === 9 && !Array.isArray(board[0])) {
    return board as Cell[];
  }
  if (Array.isArray(board) && board.length === 3) {
    return (board as Cell[][]).flat();
  }
  return Array(9).fill(null);
}

function checkWinner(cells: Cell[]): { winner: Cell; line: number[] } | null {
  for (const line of winLines) {
    const [a, b, c] = line;
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return { winner: cells[a], line };
    }
  }
  return null;
}

/* ---------- Shared SVG defs (gradients, filters) ---------- */

function BoardDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
      <defs>
        {/* X gradients */}
        <linearGradient id="ttt-x-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5d0fe" />
          <stop offset="45%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="ttt-x-highlight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* O gradients */}
        <linearGradient id="ttt-o-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f7fa" />
          <stop offset="45%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Gold win gradient */}
        <linearGradient id="ttt-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        {/* Win line gradient */}
        <linearGradient id="ttt-winline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(251, 191, 36, 0)" />
          <stop offset="30%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="70%" stopColor="#fde047" />
          <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
        </linearGradient>

        {/* Glow filters */}
        <filter id="ttt-glow-x" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ttt-glow-o" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ttt-glow-gold" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ttt-winline-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.05" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

/* ---------- Premium X ---------- */

function XMark({ ghost, isWinner, reduce }: { ghost?: boolean; isWinner?: boolean; reduce?: boolean }) {
  const commonAnim = ghost
    ? { pathLength: 1, opacity: 0.22 }
    : { pathLength: 1, opacity: 1 };

  const transition = ghost
    ? { duration: 0.2 }
    : reduce
      ? { duration: 0.2 }
      : { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={cn(
        'w-[62%] h-[62%]',
        isWinner
          ? 'drop-shadow-[0_0_18px_rgba(124,58,237,0.65)]'
          : 'drop-shadow-[0_0_14px_rgba(124,58,237,0.35)]',
      )}
      initial={ghost ? false : { scale: 0.6, rotate: -35, opacity: 0 }}
      animate={
        ghost
          ? { scale: 1, opacity: 1 }
          : isWinner
            ? { scale: [1, 1.12, 1.05], rotate: 0, opacity: 1 }
            : { scale: 1, rotate: 0, opacity: 1 }
      }
      transition={
        ghost
          ? { duration: 0.15 }
          : isWinner
            ? { scale: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } }
            : { type: 'spring', stiffness: 320, damping: 20, mass: 0.7 }
      }
      aria-hidden
    >
      {/* Outer glow */}
      {!ghost && (
        <g opacity="0.5" filter="url(#ttt-glow-x)">
          <line x1="24" y1="24" x2="76" y2="76" stroke="#a855f7" strokeWidth="18" strokeLinecap="round" />
          <line x1="76" y1="24" x2="24" y2="76" stroke="#a855f7" strokeWidth="18" strokeLinecap="round" />
        </g>
      )}

      {/* Main strokes with draw animation — keep purple on win so gold tiles never hide the mark */}
      <motion.line
        x1="24" y1="24" x2="76" y2="76"
        stroke="url(#ttt-x-grad)"
        strokeWidth={isWinner ? 14 : 12}
        strokeLinecap="round"
        initial={ghost ? false : { pathLength: 0, opacity: 0 }}
        animate={commonAnim}
        transition={transition}
      />
      <motion.line
        x1="76" y1="24" x2="24" y2="76"
        stroke="url(#ttt-x-grad)"
        strokeWidth={isWinner ? 14 : 12}
        strokeLinecap="round"
        initial={ghost ? false : { pathLength: 0, opacity: 0 }}
        animate={commonAnim}
        transition={ghost ? transition : { ...transition, delay: 0.15 }}
      />

      {/* Metallic highlight */}
      {!ghost && (
        <>
          <line x1="26" y1="24" x2="76" y2="74" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="74" y1="24" x2="24" y2="74" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </motion.svg>
  );
}

/* ---------- Premium O ---------- */

function OMark({ ghost, isWinner, reduce }: { ghost?: boolean; isWinner?: boolean; reduce?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={cn(
        'w-[62%] h-[62%]',
        isWinner
          ? 'drop-shadow-[0_0_18px_rgba(6,182,212,0.65)]'
          : 'drop-shadow-[0_0_14px_rgba(6,182,212,0.35)]',
      )}
      initial={ghost ? false : { scale: 0, rotate: -60, opacity: 0 }}
      animate={
        ghost
          ? { scale: 1, opacity: 1 }
          : isWinner
            ? { scale: [1, 1.12, 1.05], rotate: 0, opacity: 1 }
            : { scale: 1, rotate: 0, opacity: 1 }
      }
      transition={
        ghost
          ? { duration: 0.15 }
          : isWinner
            ? { scale: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } }
            : reduce
              ? { duration: 0.2 }
              : { type: 'spring', stiffness: 300, damping: 18, mass: 0.75 }
      }
      aria-hidden
    >
      {/* Outer glow */}
      {!ghost && (
        <circle
          cx="50"
          cy="50"
          r="26"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="16"
          opacity="0.5"
          filter="url(#ttt-glow-o)"
        />
      )}

      {/* Main ring — keep cyan on win so gold tiles never hide the mark */}
      <motion.circle
        cx="50"
        cy="50"
        r="26"
        fill="none"
        stroke="url(#ttt-o-grad)"
        strokeWidth={isWinner ? 14 : 12}
        strokeLinecap="round"
        initial={ghost ? false : { pathLength: 0, opacity: 0 }}
        animate={ghost ? { pathLength: 1, opacity: 0.22 } : { pathLength: 1, opacity: 1 }}
        transition={
          ghost ? { duration: 0.2 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
        }
      />

      {/* Inner glass reflection arc */}
      {!ghost && (
        <>
          <path
            d="M 30 40 Q 42 26, 62 30"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 32 60 Q 40 72, 56 72"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
    </motion.svg>
  );
}

function MarkIcon({
  mark,
  isWinner,
  ghost,
  reduce,
}: {
  mark: 'X' | 'O';
  isWinner?: boolean;
  ghost?: boolean;
  reduce?: boolean;
}) {
  return mark === 'X' ? (
    <XMark ghost={ghost} isWinner={isWinner} reduce={reduce} />
  ) : (
    <OMark ghost={ghost} isWinner={isWinner} reduce={reduce} />
  );
}

/* ---------- Win line overlay ---------- */

function WinLineSVG({ line }: { line: number[] }) {
  const [x1, y1] = CELL_CENTER[line[0]];
  const [x2, y2] = CELL_CENTER[line[2]];

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
      viewBox="0 0 3 3"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="ttt-winline-inline" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="rgba(120, 53, 15, 0.45)"
        strokeWidth="0.28"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay: 0.1 }}
      />
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="url(#ttt-winline-inline)"
        strokeWidth="0.18"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay: 0.15 }}
      />
    </svg>
  );
}

/* ---------- Confetti burst on win ---------- */

const CONFETTI_COLORS = ['#fbbf24', '#f59e0b', '#a855f7', '#22d3ee', '#ec4899', '#ffffff'];

function ConfettiBurst({ visible }: { visible: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        id: i,
        angle: (i / 44) * Math.PI * 2 + Math.random() * 0.4,
        dist: 120 + Math.random() * 180,
        size: 4 + Math.random() * 6,
        gravity: 60 + Math.random() * 80,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rot: Math.random() * 360,
        rotEnd: (Math.random() - 0.5) * 720,
        delay: Math.random() * 0.15,
        duration: 1.2 + Math.random() * 0.6,
        shape: i % 3,
      })),
    [],
  );

  return (
    <AnimatePresence>
      {visible && (
        <div
          className="pointer-events-none absolute inset-0 z-40 overflow-visible"
          aria-hidden
        >
          {pieces.map((p) => (
            <motion.span
              key={p.id}
              className="absolute top-1/2 left-1/2"
              style={{
                width: p.size,
                height: p.shape === 1 ? p.size * 0.4 : p.size,
                backgroundColor: p.color,
                borderRadius: p.shape === 2 ? '50%' : '2px',
                boxShadow: `0 0 8px ${p.color}`,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: p.rot }}
              animate={{
                x: Math.cos(p.angle) * p.dist,
                y: Math.sin(p.angle) * p.dist + p.gravity,
                opacity: 0,
                scale: 1,
                rotate: p.rot + p.rotEnd,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

function WinCellSparkles({ color = '#fde047' }: { color?: string }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        left: 15 + Math.random() * 70,
        top: 15 + Math.random() * 70,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 0.6,
        duration: 1 + Math.random() * 0.6,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-visible" aria-hidden>
      {sparks.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            background: color,
            boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.2, 0],
            y: [0, -14, -22],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: 0.4,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Turn banner ---------- */

function TurnBanner({
  state,
  myMark,
  currentMark,
  winnerMark,
}: {
  state: 'my' | 'opponent' | 'waiting' | 'win' | 'loss' | 'draw' | 'local';
  myMark?: 'X' | 'O';
  currentMark?: 'X' | 'O';
  winnerMark?: 'X' | 'O' | null;
}) {
  const dot = (color: string) => (
    <span className="relative flex h-2.5 w-2.5">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ background: color }}
      />
      <span
        className="relative inline-flex rounded-full h-2.5 w-2.5"
        style={{ background: color }}
      />
    </span>
  );

  const content = (() => {
    switch (state) {
      case 'my':
        return (
          <>
            {dot('#a855f7')}
            <span>Your turn</span>
            {myMark && (
              <span
                className={cn(
                  'font-display text-sm tracking-[0.18em] font-bold',
                  myMark === 'X'
                    ? 'text-primary-500 [text-shadow:0_0_16px_rgba(168,85,247,0.55)]'
                    : 'text-cyan-500 [text-shadow:0_0_16px_rgba(34,211,238,0.55)]',
                )}
              >
                {myMark}
              </span>
            )}
          </>
        );
      case 'opponent':
        return (
          <>
            {dot('#22d3ee')}
            <span>Opponent&apos;s turn</span>
          </>
        );
      case 'waiting':
        return (
          <>
            <Hourglass className="w-4 h-4 text-theme-muted animate-pulse" />
            <span>Waiting…</span>
          </>
        );
      case 'win':
        return (
          <>
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>You won{winnerMark ? ` with ${winnerMark}` : ''}!</span>
          </>
        );
      case 'loss':
        return (
          <>
            <span>Opponent wins{winnerMark ? ` with ${winnerMark}` : ''}</span>
          </>
        );
      case 'draw':
        return <span>Draw — board is full</span>;
      case 'local':
        return (
          <>
            <span>Turn</span>
            <span
              className={cn(
                'font-display text-sm tracking-[0.18em] font-bold',
                currentMark === 'X' ? 'text-primary-500' : 'text-cyan-500',
              )}
            >
              {currentMark}
            </span>
          </>
        );
    }
  })();

  return (
    <motion.div
      key={state}
      layout
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }}
      className={cn(
        'inline-flex items-center gap-2.5 px-4 py-2 rounded-full',
        'text-sm font-semibold tracking-tight',
        'ttt-banner',
        state === 'my' && 'ttt-banner-active',
        state === 'win' && 'ttt-banner-win',
        state === 'loss' && 'ttt-banner-loss',
      )}
    >
      {content}
    </motion.div>
  );
}

/* ---------- Board component ---------- */

export function TicTacToeBoard({
  onGameEnd,
  onMove,
  board: externalBoard,
  disabled,
  isMyTurn,
  myMark,
}: TicTacToeBoardProps) {
  const isServerMode = !!onMove;
  const reduce = !!useReducedMotion();

  const [localBoard, setLocalBoard] = useState<Cell[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const boardControls = useAnimationControls();
  const prevWinRef = useRef<boolean>(false);
  const prevFilledRef = useRef<number>(0);

  const board = isServerMode ? flattenBoard(externalBoard) : localBoard;
  const winnerMark = winningLine ? board[winningLine[0]] : null;
  const filledCount = board.filter((c) => c !== null).length;
  const isDraw = !winningLine && filledCount === 9;

  const sounds = useTttSounds();

  useEffect(() => {
    if (!isServerMode) return;
    const flat = flattenBoard(externalBoard);
    setWinningLine(checkWinner(flat)?.line ?? null);
  }, [externalBoard, isServerMode]);

  useEffect(() => {
    if (filledCount > prevFilledRef.current) {
      sounds.playMove();
    }
    prevFilledRef.current = filledCount;
  }, [filledCount, sounds]);

  useEffect(() => {
    const isWin = !!winningLine;
    if (isWin && !prevWinRef.current) {
      setShowConfetti(true);
      sounds.playWin();
      if (!reduce) {
        boardControls.start({
          x: [0, -6, 6, -4, 4, -3, 3, -1, 1, 0],
          transition: { duration: 0.7, ease: 'easeInOut' },
        });
      }
      const t = setTimeout(() => setShowConfetti(false), 1800);
      prevWinRef.current = isWin;
      return () => clearTimeout(t);
    }
    if (!isWin && prevWinRef.current) {
      prevWinRef.current = false;
    }
  }, [winningLine, boardControls, reduce, sounds]);

  useEffect(() => {
    if (isDraw) sounds.playDraw();
  }, [isDraw, sounds]);

  const handleClick = (index: number) => {
    if (disabled || board[index] || winningLine) return;

    if (isServerMode) {
      onMove?.({ row: Math.floor(index / 3), col: index % 3 });
      return;
    }

    const newBoard = [...board];
    newBoard[index] = isXTurn ? 'X' : 'O';
    setLocalBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinningLine(result.line);
      onGameEnd?.(result.winner === 'X' ? 'player1' : 'player2');
      return;
    }
    if (newBoard.every((cell) => cell !== null)) {
      onGameEnd?.(null);
      return;
    }
    setIsXTurn(!isXTurn);
  };

  const handleHover = (index: number) => {
    if (disabled || board[index] || winningLine) return;
    if (hoverIndex !== index) sounds.playHover();
    setHoverIndex(index);
  };

  const currentMark: 'X' | 'O' = isServerMode
    ? myMark || (filledCount % 2 === 0 ? 'X' : 'O')
    : isXTurn
      ? 'X'
      : 'O';

  const previewMark: 'X' | 'O' | null =
    isServerMode && isMyTurn && myMark ? myMark : !isServerMode ? currentMark : null;

  const canPlay = !disabled && !winningLine && (!isServerMode || !!isMyTurn);

  const bannerState: 'my' | 'opponent' | 'waiting' | 'win' | 'loss' | 'draw' | 'local' = winningLine
    ? myMark && winnerMark && winnerMark !== myMark
      ? 'loss'
      : 'win'
    : isDraw
      ? 'draw'
      : isServerMode
        ? isMyTurn === true
          ? 'my'
          : isMyTurn === false
            ? 'opponent'
            : 'waiting'
        : 'local';

  return (
    <div className="ttt-stage flex flex-col items-center gap-5 sm:gap-6 select-none relative z-[1] w-full max-w-[min(100%,540px)]">
      <BoardDefs />

      <div className="min-h-[44px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <TurnBanner
            key={bannerState}
            state={bannerState}
            myMark={myMark}
            currentMark={currentMark}
            winnerMark={winnerMark}
          />
        </AnimatePresence>
      </div>

      <motion.div
        animate={boardControls}
        className={cn(
          'relative w-full ttt-frame',
          winningLine && 'ttt-frame-win',
          canPlay && 'ttt-frame-active',
        )}
      >
        {/* Ambient underglow */}
        <div className="ttt-frame-halo pointer-events-none" aria-hidden />

        <div
          className="relative grid grid-cols-3 w-full aspect-square ttt-grid"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {winningLine && <WinLineSVG line={winningLine} />}

          {board.map((cell, index) => {
            const isWinCell = winningLine?.includes(index);
            const isDimmed = !!winningLine && !isWinCell;
            const showGhost =
              !cell && canPlay && hoverIndex === index && !!previewMark;

            return (
              <motion.button
                key={index}
                type="button"
                aria-label={
                  cell
                    ? `Cell ${index + 1}, ${cell}`
                    : canPlay
                      ? `Place ${previewMark ?? 'mark'} on cell ${index + 1}`
                      : `Cell ${index + 1}`
                }
                initial={false}
                animate={
                  isDimmed
                    ? { opacity: 0.22 }
                    : { opacity: 1 }
                }
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }}
                onClick={() => handleClick(index)}
                onMouseEnter={() => handleHover(index)}
                onFocus={() => setHoverIndex(index)}
                onBlur={() => setHoverIndex(null)}
                disabled={disabled || !!cell || !!winningLine}
                className={cn(
                  'group relative min-w-0 min-h-0 w-full h-full',
                  'flex items-center justify-center outline-none',
                  'focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-primary-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                  'ttt-tile',
                  isWinCell && 'ttt-tile-winner',
                  !cell && canPlay && 'ttt-tile-playable',
                  !cell && !canPlay && !isDimmed && 'ttt-tile-idle',
                )}
              >
                {/* Highlight sheen on hover / active */}
                <span className="ttt-tile-sheen pointer-events-none" aria-hidden />
                {/* Winner shine sweep */}
                {isWinCell && <span className="ttt-tile-shine pointer-events-none" aria-hidden />}
                {/* Winner sparkles */}
                {isWinCell && <WinCellSparkles />}

                {cell ? (
                  <MarkIcon mark={cell} isWinner={!!isWinCell} reduce={reduce} />
                ) : showGhost && previewMark ? (
                  <MarkIcon mark={previewMark} ghost reduce={reduce} />
                ) : null}
              </motion.button>
            );
          })}
        </div>

        <ConfettiBurst visible={showConfetti} />
      </motion.div>
    </div>
  );
}


