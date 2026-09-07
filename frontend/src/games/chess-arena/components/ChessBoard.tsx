'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChessPiece } from '@/components/game/chess/ChessPiece';
import { cn } from '@/lib/utils';
import { ANIM_MS, BOARD_THEMES } from '../config';
import type {
  ChessBoardTheme,
  ChessColor,
  ChessGrid,
  ChessMoveInput,
  ChessPieceStyle,
  ChessPieceType,
  ChessPos,
  ChessSettings,
} from '../types';
import { SvgPiece } from './SvgPieces';

const FILES = 'abcdefgh';

interface ChessBoardProps {
  board: ChessGrid;
  orientation: ChessColor;
  playerColor?: ChessColor | 'both';
  disabled?: boolean;
  inCheck?: boolean;
  checkColor?: ChessColor;
  checkmate?: boolean;
  lastMove?: { from: ChessPos; to: ChessPos } | null;
  settings: ChessSettings;
  onMove: (move: ChessMoveInput) => boolean | void;
  onIllegal?: () => void;
  legalTargets: (from: ChessPos) => ChessPos[];
  needsPromotion?: (from: ChessPos, to: ChessPos) => boolean;
  onPromoteRequest?: (from: ChessPos, to: ChessPos) => void;
  flipKey?: number;
}

function toDisplay(pos: ChessPos, orientation: ChessColor): ChessPos {
  if (orientation === 'white') return pos;
  return { row: 7 - pos.row, col: 7 - pos.col };
}

function toLogical(pos: ChessPos, orientation: ChessColor): ChessPos {
  return toDisplay(pos, orientation);
}

function posKey(pos: ChessPos) {
  return `${pos.row}-${pos.col}`;
}

function boardSignature(board: ChessGrid) {
  return board.map((row) => row.map((p) => (p ? `${p.color[0]}${p.type[0]}` : '.')).join('')).join('/');
}

function detectMove(prev: ChessGrid, next: ChessGrid) {
  const vacated: ChessPos[] = [];
  const occupied: ChessPos[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const a = prev[r][c];
      const b = next[r][c];
      const ak = a ? `${a.color}:${a.type}` : '';
      const bk = b ? `${b.color}:${b.type}` : '';
      if (ak === bk) continue;
      if (a && !b) vacated.push({ row: r, col: c });
      else occupied.push({ row: r, col: c });
    }
  }
  if (!vacated.length || !occupied.length) return null;
  const from = vacated[0];
  const to = occupied.find((p) => next[p.row][p.col]?.color === prev[from.row][from.col]?.color) || occupied[0];
  const piece = next[to.row][to.col];
  if (!piece) return null;
  return { from, to, piece, captured: Boolean(prev[to.row][to.col]) };
}

export function ChessBoard({
  board,
  orientation,
  playerColor = 'both',
  disabled,
  inCheck,
  checkColor,
  checkmate,
  lastMove: lastMoveProp,
  settings,
  onMove,
  onIllegal,
  legalTargets,
  needsPromotion,
  onPromoteRequest,
  flipKey = 0,
}: ChessBoardProps) {
  const reduce = useReducedMotion();
  const theme = BOARD_THEMES[settings.boardTheme as ChessBoardTheme] || BOARD_THEMES.default;
  const moveMs = reduce || settings.animationSpeed === 'off' ? 0 : ANIM_MS[settings.animationSpeed];
  const [selected, setSelected] = useState<ChessPos | null>(null);
  const [hints, setHints] = useState<ChessPos[]>([]);
  const [hover, setHover] = useState<ChessPos | null>(null);
  const [focusSq, setFocusSq] = useState<ChessPos>({ row: 7, col: 0 });
  const [displayBoard, setDisplayBoard] = useState(board);
  const [animating, setAnimating] = useState<{
    piece: NonNullable<ChessGrid[0][0]>;
    from: ChessPos;
    to: ChessPos;
  } | null>(null);
  const [dragging, setDragging] = useState<{
    from: ChessPos;
    piece: NonNullable<ChessGrid[0][0]>;
    x: number;
    y: number;
  } | null>(null);
  const [captureFlash, setCaptureFlash] = useState<ChessPos | null>(null);
  const [internalLast, setInternalLast] = useState<{ from: ChessPos; to: ChessPos } | null>(null);
  const lastMove = lastMoveProp ?? internalLast;
  const surfaceRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef(board);
  const latestRef = useRef(board);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggedRef = useRef(false);
  latestRef.current = board;

  useEffect(() => {
    const prev = prevRef.current;
    if (boardSignature(prev) === boardSignature(board)) {
      setDisplayBoard(board);
      return;
    }
    const move = detectMove(prev, board);
    prevRef.current = board;
    if (!move || moveMs === 0) {
      setDisplayBoard(board);
      setAnimating(null);
      if (move) setInternalLast(move);
      return;
    }
    const mid = prev.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
    mid[move.from.row][move.from.col] = null;
    mid[move.to.row][move.to.col] = null;
    setDisplayBoard(mid);
    setAnimating(move);
    setInternalLast({ from: move.from, to: move.to });
    if (move.captured) setCaptureFlash(move.to);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDisplayBoard(latestRef.current);
      setAnimating(null);
      setCaptureFlash(null);
    }, moveMs);
  }, [board, moveMs]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const hintSet = useMemo(() => new Set(hints.map(posKey)), [hints]);
  const kingPos = useMemo(() => {
    if (!inCheck || !checkColor) return null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = displayBoard[r][c];
        if (p?.type === 'king' && p.color === checkColor) return { row: r, col: c };
      }
    }
    return null;
  }, [displayBoard, inCheck, checkColor]);

  const canControl = useCallback(
    (piece: { color: ChessColor } | null) => {
      if (!piece || disabled || animating) return false;
      if (playerColor === 'both') return true;
      return piece.color === playerColor;
    },
    [disabled, animating, playerColor]
  );

  const selectSquare = (logical: ChessPos) => {
    const piece = displayBoard[logical.row]?.[logical.col];
    if (!selected) {
      if (!canControl(piece)) return;
      setSelected(logical);
      setHints(settings.legalHints ? legalTargets(logical) : []);
      return;
    }
    if (selected.row === logical.row && selected.col === logical.col) {
      setSelected(null);
      setHints([]);
      return;
    }
    if (piece && canControl(piece)) {
      setSelected(logical);
      setHints(settings.legalHints ? legalTargets(logical) : []);
      return;
    }
    attemptMove(selected, logical);
  };

  const attemptMove = (from: ChessPos, to: ChessPos) => {
    const legal = legalTargets(from);
    const ok = legal.some((p) => p.row === to.row && p.col === to.col);
    if (!ok) {
      onIllegal?.();
      setSelected(null);
      setHints([]);
      return;
    }
    if (needsPromotion?.(from, to)) {
      onPromoteRequest?.(from, to);
      setSelected(null);
      setHints([]);
      return;
    }
    onMove({ from, to });
    setSelected(null);
    setHints([]);
  };

  const displayFromPoint = (clientX: number, clientY: number): ChessPos | null => {
    const el = surfaceRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    if (x < 0 || y < 0 || x > 1 || y > 1) return null;
    return { row: Math.min(7, Math.max(0, Math.floor(y * 8))), col: Math.min(7, Math.max(0, Math.floor(x * 8))) };
  };

  const onPointerDown = (e: React.PointerEvent, display: ChessPos, logical: ChessPos) => {
    if (disabled) return;
    const piece = displayBoard[logical.row]?.[logical.col];
    if (!canControl(piece) || !piece) {
      selectSquare(logical);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    draggedRef.current = false;
    setSelected(logical);
    setHints(settings.legalHints ? legalTargets(logical) : []);
    setDragging({ from: logical, piece, x: e.clientX, y: e.clientY });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    if (Math.abs(e.clientX - dragging.x) + Math.abs(e.clientY - dragging.y) > 4) draggedRef.current = true;
    setDragging({ ...dragging, x: e.clientX, y: e.clientY });
    const display = displayFromPoint(e.clientX, e.clientY);
    setHover(display);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    const display = displayFromPoint(e.clientX, e.clientY);
    const from = dragging.from;
    setDragging(null);
    if (!display) {
      setSelected(null);
      setHints([]);
      return;
    }
    const logical = toLogical(display, orientation);
    if (logical.row === from.row && logical.col === from.col) {
      return;
    }
    attemptMove(from, logical);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const dir: Record<string, ChessPos> = {
      ArrowUp: { row: -1, col: 0 },
      ArrowDown: { row: 1, col: 0 },
      ArrowLeft: { row: 0, col: -1 },
      ArrowRight: { row: 0, col: 1 },
    };
    if (dir[e.key]) {
      e.preventDefault();
      setFocusSq((prev) => ({
        row: Math.min(7, Math.max(0, prev.row + dir[e.key].row)),
        col: Math.min(7, Math.max(0, prev.col + dir[e.key].col)),
      }));
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectSquare(toLogical(focusSq, orientation));
    }
    if (e.key === 'Escape') {
      setSelected(null);
      setHints([]);
    }
  };

  const fileLabels = orientation === 'white' ? FILES.split('') : FILES.split('').reverse();
  const rankLabels = orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

  const renderPiece = (type: ChessPieceType, color: ChessColor, extras?: { selected?: boolean; lifted?: boolean; capturing?: boolean }) =>
    settings.pieceStyle === 'classic' ? (
      <span className={cn('w-full h-full block', extras?.selected && 'cx-piece-lift', extras?.lifted && 'cx-piece-drag')}>
        <SvgPiece type={type} color={color} />
      </span>
    ) : (
      <ChessPiece type={type} color={color} selected={extras?.selected} lifted={extras?.lifted} capturing={extras?.capturing} />
    );

  return (
    <motion.div
      className="cx-board-wrap"
      key={`orient-${orientation}-${flipKey}`}
      initial={reduce ? false : { opacity: 0.55, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="cx-board"
        role="application"
        aria-label="Chess board"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDragging(null)}
      >
        <div className="cx-board-shadow" aria-hidden />
        <div className="cx-board-rim" style={{ background: theme.rim }}>
          {settings.coordinates && (
            <>
              <div className="cx-files">
                {fileLabels.map((f) => (
                  <span key={f} style={{ color: theme.coord }}>{f}</span>
                ))}
              </div>
              <div className="cx-ranks">
                {rankLabels.map((r) => (
                  <span key={r} style={{ color: theme.coord }}>{r}</span>
                ))}
              </div>
            </>
          )}
          <div
            ref={surfaceRef}
            className="cx-surface"
            style={{ touchAction: 'none' }}
          >
            {Array.from({ length: 8 }, (_, displayRow) =>
              Array.from({ length: 8 }, (_, displayCol) => {
                const logical = toLogical({ row: displayRow, col: displayCol }, orientation);
                const piece = displayBoard[logical.row]?.[logical.col];
                const hidden = dragging && dragging.from.row === logical.row && dragging.from.col === logical.col;
                const isLight = (logical.row + logical.col) % 2 === 0;
                const isSelected = selected?.row === logical.row && selected?.col === logical.col;
                const isHint = hintSet.has(posKey(logical));
                const isCapture = isHint && !!piece;
                const isLast =
                  settings.lastMoveHighlight &&
                  lastMove &&
                  ((lastMove.from.row === logical.row && lastMove.from.col === logical.col) ||
                    (lastMove.to.row === logical.row && lastMove.to.col === logical.col));
                const isCheck = kingPos?.row === logical.row && kingPos?.col === logical.col;
                const isFocus = focusSq.row === displayRow && focusSq.col === displayCol;
                const hovered = hover?.row === displayRow && hover?.col === displayCol;

                return (
                  <button
                    key={`${displayRow}-${displayCol}`}
                    type="button"
                    disabled={disabled}
                    aria-label={`${FILES[logical.col]}${8 - logical.row}${piece ? `, ${piece.color} ${piece.type}` : ''}`}
                    onClick={() => {
                      if (draggedRef.current) {
                        draggedRef.current = false;
                        return;
                      }
                      selectSquare(logical);
                    }}
                    onPointerDown={(e) => onPointerDown(e, { row: displayRow, col: displayCol }, logical)}
                    onMouseEnter={() => setHover({ row: displayRow, col: displayCol })}
                    onMouseLeave={() => setHover(null)}
                    className={cn('cx-sq', isFocus && 'is-focus')}
                    style={{ backgroundImage: isLight ? theme.light : theme.dark }}
                  >
                    {isLast && <span className="cx-mark" style={{ background: theme.last }} />}
                    {isSelected && <span className="cx-mark" style={{ background: theme.selected }} />}
                    {isCheck && (
                      <motion.span
                        className="cx-mark"
                        style={{ background: checkmate ? theme.mate : theme.check }}
                        animate={reduce ? undefined : { opacity: [0.45, 0.8, 0.45] }}
                        transition={{ duration: 0.9, repeat: Infinity }}
                      />
                    )}
                    {hovered && !isSelected && !disabled && <span className="cx-hover" />}
                    {isHint && !isCapture && settings.legalHints && (
                      <span className="cx-dot" style={{ background: theme.hint }} />
                    )}
                    {isCapture && settings.legalHints && (
                      <span className="cx-ring" style={{ borderColor: theme.capture }} />
                    )}
                    {piece && !hidden && (
                      <span className="cx-piece" style={{ zIndex: 8 + displayRow }}>
                        {renderPiece(piece.type, piece.color, {
                          selected: isSelected,
                          capturing: captureFlash?.row === logical.row && captureFlash?.col === logical.col,
                        })}
                      </span>
                    )}
                  </button>
                );
              })
            )}
            <AnimatePresence>
              {animating && (
                <motion.div
                  key={`${posKey(animating.from)}-${posKey(animating.to)}`}
                  className="cx-fly"
                  initial={{
                    x: `${toDisplay(animating.from, orientation).col * 100}%`,
                    y: `${toDisplay(animating.from, orientation).row * 100}%`,
                  }}
                  animate={{
                    x: `${toDisplay(animating.to, orientation).col * 100}%`,
                    y: `${toDisplay(animating.to, orientation).row * 100}%`,
                  }}
                  transition={{ duration: moveMs / 1000, ease: [0.22, 1, 0.36, 1] }}
                >
                  {renderPiece(animating.piece.type, animating.piece.color, { lifted: true })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {dragging && (
        <div
          className="cx-drag-ghost"
          style={{ left: dragging.x, top: dragging.y }}
        >
          {renderPiece(dragging.piece.type, dragging.piece.color, { lifted: true })}
        </div>
      )}
    </motion.div>
  );
}
