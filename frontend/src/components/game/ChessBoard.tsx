'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChessPiece } from './chess/ChessPiece';

export interface ChessBoardProps {
  onGameEnd?: (winner: string | null) => void;
  onMove?: (move: { from: { row: number; col: number }; to: { row: number; col: number } }) => void;
  board?: unknown;
  disabled?: boolean;
  inCheck?: boolean;
  checkColor?: 'white' | 'black';
  /** Player's color — board is flipped for black */
  orientation?: 'white' | 'black';
  /** Restrict selection to this color when set */
  playerColor?: 'white' | 'black';
}

type PieceColor = 'white' | 'black';
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
type ServerPiece = { type: string; color: PieceColor; hasMoved?: boolean } | null;
type Pos = { row: number; col: number };

const FILES = 'abcdefgh';
const EMPTY: ServerPiece[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
const MOVE_MS = 360;
/** Milder tilt keeps sprite bases seated on foreshortened squares */
const BOARD_TILT = 30;

/** Maple / walnut square fills with subtle grain */
const LIGHT_SQ =
  'repeating-linear-gradient(92deg, rgba(120,85,45,0.07) 0 1px, transparent 1px 5px), repeating-linear-gradient(0deg, rgba(90,60,30,0.05) 0 1px, transparent 1px 7px), linear-gradient(155deg, #F0D9B5 0%, #E8C992 48%, #DDB87A 100%)';
const DARK_SQ =
  'repeating-linear-gradient(88deg, rgba(40,22,10,0.14) 0 1px, transparent 1px 6px), repeating-linear-gradient(0deg, rgba(20,10,5,0.1) 0 1px, transparent 1px 8px), linear-gradient(155deg, #B58863 0%, #8B5A3C 45%, #6B3F24 100%)';
const RIM_WOOD =
  'repeating-linear-gradient(90deg, rgba(255,220,170,0.08) 0 1px, transparent 1px 8px), repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 1px, transparent 1px 10px), linear-gradient(160deg, #A06B3C 0%, #7A4A28 35%, #5C3418 70%, #3E220F 100%)';

function cloneBoard(board: ServerPiece[][]): ServerPiece[][] {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function normalizeBoard(board: unknown): ServerPiece[][] {
  if (!Array.isArray(board) || board.length !== 8) return EMPTY;
  return cloneBoard(board as ServerPiece[][]);
}

function toDisplayPos(pos: Pos, orientation: PieceColor): Pos {
  if (orientation === 'white') return pos;
  return { row: 7 - pos.row, col: 7 - pos.col };
}

function toLogicalPos(pos: Pos, orientation: PieceColor): Pos {
  return toDisplayPos(pos, orientation);
}

function isPathBlocked(from: Pos, to: Pos, board: ServerPiece[][]) {
  const dr = Math.sign(to.row - from.row);
  const dc = Math.sign(to.col - from.col);
  let r = from.row + dr;
  let c = from.col + dc;
  while (r !== to.row || c !== to.col) {
    if (board[r][c]) return true;
    r += dr;
    c += dc;
  }
  return false;
}

function isValidPawnMove(piece: NonNullable<ServerPiece>, from: Pos, to: Pos, board: ServerPiece[][]) {
  const direction = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  if (dc === 0 && dr === direction && !board[to.row][to.col]) return true;
  if (
    dc === 0 &&
    dr === 2 * direction &&
    from.row === startRow &&
    !board[from.row + direction][from.col] &&
    !board[to.row][to.col]
  ) {
    return true;
  }
  if (Math.abs(dc) === 1 && dr === direction && board[to.row][to.col]) return true;
  return false;
}

function isValidKingMove(piece: NonNullable<ServerPiece>, from: Pos, to: Pos, board: ServerPiece[][]) {
  const absDr = Math.abs(to.row - from.row);
  const absDc = Math.abs(to.col - from.col);
  if (absDr <= 1 && absDc <= 1 && (absDr || absDc)) return true;
  if (!piece.hasMoved && absDr === 0 && absDc === 2) {
    if (to.col > from.col) {
      const rook = board[from.row][7];
      if (!rook || rook.type !== 'rook' || rook.hasMoved) return false;
      if (board[from.row][5] || board[from.row][6]) return false;
      return true;
    }
    const rook = board[from.row][0];
    if (!rook || rook.type !== 'rook' || rook.hasMoved) return false;
    if (board[from.row][1] || board[from.row][2] || board[from.row][3]) return false;
    return true;
  }
  return false;
}

function isPieceMoveLegal(piece: NonNullable<ServerPiece>, from: Pos, to: Pos, board: ServerPiece[][]) {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);
  switch (piece.type as PieceType) {
    case 'pawn':
      return isValidPawnMove(piece, from, to, board);
    case 'rook':
      return (dr === 0 || dc === 0) && absDr + absDc > 0 && !isPathBlocked(from, to, board);
    case 'bishop':
      return absDr === absDc && absDr > 0 && !isPathBlocked(from, to, board);
    case 'queen':
      return (
        ((dr === 0 || dc === 0) || (absDr === absDc && absDr > 0)) &&
        absDr + absDc > 0 &&
        !isPathBlocked(from, to, board)
      );
    case 'knight':
      return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
    case 'king':
      return isValidKingMove(piece, from, to, board);
    default:
      return false;
  }
}

function findKing(color: PieceColor, board: ServerPiece[][]): Pos | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p?.type === 'king' && p.color === color) return { row: r, col: c };
    }
  }
  return null;
}

function isKingInCheck(color: PieceColor, board: ServerPiece[][]) {
  const kingPos = findKing(color, board);
  if (!kingPos) return false;
  const opponent: PieceColor = color === 'white' ? 'black' : 'white';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== opponent) continue;
      if (piece.type === 'king') {
        if (Math.abs(r - kingPos.row) <= 1 && Math.abs(c - kingPos.col) <= 1) return true;
      } else if (isPieceMoveLegal(piece, { row: r, col: c }, kingPos, board)) {
        return true;
      }
    }
  }
  return false;
}

function getLegalMoves(from: Pos, board: ServerPiece[][]): Pos[] {
  const piece = board[from.row]?.[from.col];
  if (!piece) return [];
  const moves: Pos[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (r === from.row && c === from.col) continue;
      const to = { row: r, col: c };
      const target = board[r][c];
      if (target && target.color === piece.color) continue;
      if (!isPieceMoveLegal(piece, from, to, board)) continue;
      const test = cloneBoard(board);
      test[to.row][to.col] = test[from.row][from.col];
      test[from.row][from.col] = null;
      if (!isKingInCheck(piece.color, test)) moves.push(to);
    }
  }
  return moves;
}

function boardKey(board: ServerPiece[][]) {
  return board.map((row) => row.map((p) => (p ? `${p.color[0]}${p.type[0]}` : '.')).join('')).join('/');
}

function detectMove(
  prev: ServerPiece[][],
  next: ServerPiece[][]
): { from: Pos; to: Pos; piece: NonNullable<ServerPiece>; captured: boolean } | null {
  const vacated: Pos[] = [];
  const occupied: Pos[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const a = prev[r][c];
      const b = next[r][c];
      const aKey = a ? `${a.color}:${a.type}` : '';
      const bKey = b ? `${b.color}:${b.type}` : '';
      if (aKey === bKey) continue;
      if (a && !b) vacated.push({ row: r, col: c });
      else if ((!a && b) || (a && b && aKey !== bKey)) occupied.push({ row: r, col: c });
    }
  }
  if (vacated.length === 1 && occupied.length === 1) {
    const from = vacated[0];
    const to = occupied[0];
    const piece = next[to.row][to.col];
    if (piece) return { from, to, piece, captured: !!prev[to.row][to.col] };
  }
  if (vacated.length >= 1 && occupied.length >= 1) {
    for (const from of vacated) {
      const moved = prev[from.row][from.col];
      if (!moved) continue;
      for (const to of occupied) {
        const landed = next[to.row][to.col];
        if (landed && landed.color === moved.color && (landed.type === moved.type || moved.type === 'pawn')) {
          return { from, to, piece: landed, captured: !!prev[to.row][to.col] };
        }
      }
    }
  }
  return null;
}

export function ChessBoard({
  onMove,
  board: externalBoard,
  disabled,
  inCheck,
  checkColor,
  orientation = 'white',
  playerColor,
}: ChessBoardProps) {
  const board = useMemo(() => normalizeBoard(externalBoard), [externalBoard]);
  const [selected, setSelected] = useState<Pos | null>(null);
  const [hints, setHints] = useState<Pos[]>([]);
  const [hoverSq, setHoverSq] = useState<Pos | null>(null);
  const [displayBoard, setDisplayBoard] = useState(board);
  const [animating, setAnimating] = useState<{
    piece: NonNullable<ServerPiece>;
    from: Pos;
    to: Pos;
    captured: boolean;
  } | null>(null);
  const [captureFlash, setCaptureFlash] = useState<Pos | null>(null);
  const [promoteFlash, setPromoteFlash] = useState<Pos | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Pos; to: Pos } | null>(null);
  const prevBoardRef = useRef(board);
  const latestBoardRef = useRef(board);
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  latestBoardRef.current = board;

  const kingInCheckPos = useMemo(() => {
    if (!inCheck || !checkColor) return null;
    return findKing(checkColor, displayBoard);
  }, [inCheck, checkColor, displayBoard]);

  useEffect(() => {
    const prev = prevBoardRef.current;
    if (boardKey(prev) === boardKey(board)) {
      setDisplayBoard(board);
      setAnimating(null);
      return;
    }

    const move = detectMove(prev, board);
    const prevPiece = move ? prev[move.from.row][move.from.col] : null;
    const promoted =
      !!move &&
      !!prevPiece &&
      prevPiece.type === 'pawn' &&
      move.piece.type !== 'pawn';

    prevBoardRef.current = board;

    if (!move) {
      setDisplayBoard(board);
      setAnimating(null);
      return;
    }

    setLastMove({ from: move.from, to: move.to });
    setSelected(null);
    setHints([]);
    if (move.captured) setCaptureFlash(move.to);
    if (promoted) setPromoteFlash(move.to);

    // Mid-frame: clear origin (and dest for captures) so only the flying piece is visible
    const mid = cloneBoard(prev);
    mid[move.from.row][move.from.col] = null;
    mid[move.to.row][move.to.col] = null;
    setDisplayBoard(mid);
    setAnimating(move);

    if (animTimer.current) clearTimeout(animTimer.current);
    animTimer.current = setTimeout(() => {
      setDisplayBoard(latestBoardRef.current);
      setAnimating(null);
      setCaptureFlash(null);
      if (promoteTimer.current) clearTimeout(promoteTimer.current);
      promoteTimer.current = setTimeout(() => setPromoteFlash(null), 500);
    }, MOVE_MS);

    return () => {
      if (animTimer.current) {
        clearTimeout(animTimer.current);
        animTimer.current = null;
      }
      // Commit authoritative board if animation is interrupted
      setDisplayBoard(latestBoardRef.current);
      setAnimating(null);
    };
  }, [board]);

  useEffect(() => {
    return () => {
      if (promoteTimer.current) clearTimeout(promoteTimer.current);
    };
  }, []);

  const hintSet = useMemo(() => new Set(hints.map((h) => `${h.row}-${h.col}`)), [hints]);

  const handleCellClick = (displayRow: number, displayCol: number) => {
    if (disabled || animating) return;
    const { row, col } = toLogicalPos({ row: displayRow, col: displayCol }, orientation);
    const piece = displayBoard[row]?.[col];

    if (!selected) {
      if (!piece) return;
      if (playerColor && piece.color !== playerColor) return;
      setSelected({ row, col });
      setHints(getLegalMoves({ row, col }, displayBoard));
      return;
    }

    if (selected.row === row && selected.col === col) {
      setSelected(null);
      setHints([]);
      return;
    }

    const isHint = hintSet.has(`${row}-${col}`);
    const clickedOwn =
      piece && selected && displayBoard[selected.row][selected.col]?.color === piece.color;

    if (clickedOwn) {
      if (playerColor && piece.color !== playerColor) return;
      setSelected({ row, col });
      setHints(getLegalMoves({ row, col }, displayBoard));
      return;
    }

    if (!isHint) {
      setSelected(null);
      setHints([]);
      return;
    }

    onMove?.({ from: { row: selected.row, col: selected.col }, to: { row, col } });
    setSelected(null);
    setHints([]);
  };

  const displayRows = useMemo(() => {
    const rows = Array.from({ length: 8 }, (_, displayRow) =>
      Array.from({ length: 8 }, (_, displayCol) => {
        const logical = toLogicalPos({ row: displayRow, col: displayCol }, orientation);
        return {
          displayRow,
          displayCol,
          logicalRow: logical.row,
          logicalCol: logical.col,
          piece: displayBoard[logical.row]?.[logical.col] ?? null,
        };
      })
    );
    return rows;
  }, [displayBoard, orientation]);

  const animFromDisplay = animating ? toDisplayPos(animating.from, orientation) : null;
  const animToDisplay = animating ? toDisplayPos(animating.to, orientation) : null;

  const cellPct = 12.5;
  const fileLabels =
    orientation === 'white' ? FILES.split('') : FILES.split('').reverse();
  const rankLabels =
    orientation === 'white'
      ? [8, 7, 6, 5, 4, 3, 2, 1]
      : [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <motion.div
      className="w-full max-w-[min(100%,560px)] mx-auto"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="relative w-full aspect-square"
        style={{ perspective: '2200px', perspectiveOrigin: '50% 28%' }}
      >
        {/* Floor contact shadow */}
        <div
          className="pointer-events-none absolute inset-x-[6%] bottom-[-2%] h-[16%] rounded-[50%] blur-2xl"
          style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 72%)' }}
        />

        <div
          className="absolute inset-[4%] sm:inset-[5.5%] origin-center will-change-transform"
          style={{
            transform: `rotateX(${BOARD_TILT}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Board thickness / edge */}
          <div
            className="absolute inset-[-1%] rounded-[18px]"
            style={{
              background: 'linear-gradient(180deg, #5C3418 0%, #2A1608 100%)',
              transform: 'translateZ(-18px)',
              boxShadow: '0 28px 40px rgba(0,0,0,0.45)',
            }}
          />

          {/* Thick walnut rim with coordinate labels */}
          <div
            className="absolute inset-[-7.5%] rounded-[22px]"
            style={{
              background: RIM_WOOD,
              boxShadow:
                '0 24px 40px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,230,190,0.28), inset 0 -2px 0 rgba(0,0,0,0.35)',
              transform: 'translateZ(-4px)',
            }}
          >
            {/* Rim gloss */}
            <div
              className="pointer-events-none absolute inset-0 rounded-[22px] opacity-50"
              style={{
                background:
                  'linear-gradient(125deg, rgba(255,255,255,0.28) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.06) 100%)',
              }}
            />

            {/* File labels (a–h) along near edge */}
            <div className="absolute inset-x-[7.5%] bottom-[1.6%] grid grid-cols-8 pointer-events-none">
              {fileLabels.map((f) => (
                <span
                  key={`file-${f}`}
                  className="text-center text-[9px] sm:text-[11px] font-semibold tracking-wide"
                  style={{ color: 'rgba(245,230,200,0.72)', textShadow: '0 1px 1px rgba(0,0,0,0.45)' }}
                >
                  {f}
                </span>
              ))}
            </div>

            {/* Rank labels (1–8) on both sides */}
            <div className="absolute inset-y-[7.5%] left-[1.4%] flex flex-col justify-between pointer-events-none py-[0.5%]">
              {rankLabels.map((r) => (
                <span
                  key={`rank-l-${r}`}
                  className="text-[9px] sm:text-[11px] font-semibold leading-none"
                  style={{ color: 'rgba(245,230,200,0.72)', textShadow: '0 1px 1px rgba(0,0,0,0.45)' }}
                >
                  {r}
                </span>
              ))}
            </div>
            <div className="absolute inset-y-[7.5%] right-[1.4%] flex flex-col justify-between items-end pointer-events-none py-[0.5%]">
              {rankLabels.map((r) => (
                <span
                  key={`rank-r-${r}`}
                  className="text-[9px] sm:text-[11px] font-semibold leading-none"
                  style={{ color: 'rgba(245,230,200,0.72)', textShadow: '0 1px 1px rgba(0,0,0,0.45)' }}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Playing surface — overflow visible so tall 3D pieces aren't clipped */}
          <div
            className="absolute inset-0 rounded-[10px]"
            style={{
              transformStyle: 'preserve-3d',
              boxShadow:
                'inset 0 0 0 1px rgba(40,22,10,0.55), inset 0 0 28px rgba(0,0,0,0.12)',
            }}
          >
            {/* Soft top light */}
            <div
              className="pointer-events-none absolute inset-0 z-10 mix-blend-soft-light opacity-45"
              style={{
                background:
                  'linear-gradient(165deg, rgba(255,255,255,0.5) 0%, transparent 38%, transparent 72%, rgba(0,0,0,0.14) 100%)',
              }}
            />

            <div className="grid grid-cols-8 grid-rows-8 w-full h-full overflow-visible rounded-[10px]">
              {displayRows.map((row) =>
                row.map(({ displayRow, displayCol, logicalRow, logicalCol, piece }) => {
                  const isLight = (logicalRow + logicalCol) % 2 === 0;
                  const isSelected = selected?.row === logicalRow && selected?.col === logicalCol;
                  const isHint = hintSet.has(`${logicalRow}-${logicalCol}`);
                  const isCapture = isHint && !!piece;
                  const isLastFrom =
                    lastMove?.from.row === logicalRow && lastMove?.from.col === logicalCol;
                  const isLastTo =
                    lastMove?.to.row === logicalRow && lastMove?.to.col === logicalCol;
                  const isHover = hoverSq?.row === displayRow && hoverSq?.col === displayCol;
                  const isCheckSq =
                    kingInCheckPos?.row === logicalRow && kingInCheckPos?.col === logicalCol;
                  const isCaptureAnim =
                    captureFlash?.row === logicalRow && captureFlash?.col === logicalCol;
                  const isPromote =
                    promoteFlash?.row === logicalRow && promoteFlash?.col === logicalCol;

                  return (
                    <button
                      key={`${displayRow}-${displayCol}`}
                      type="button"
                      disabled={disabled}
                      aria-label={`${FILES[logicalCol]}${8 - logicalRow}${piece ? `, ${piece.color} ${piece.type}` : ''}`}
                      onClick={() => handleCellClick(displayRow, displayCol)}
                      onMouseEnter={() => setHoverSq({ row: displayRow, col: displayCol })}
                      onMouseLeave={() => setHoverSq(null)}
                      className={cn(
                        'relative w-full h-full flex items-end justify-center outline-none overflow-visible',
                        !disabled && 'cursor-pointer'
                      )}
                      style={{ backgroundImage: isLight ? LIGHT_SQ : DARK_SQ }}
                    >
                      {(isLastFrom || isLastTo) && (
                        <span className="absolute inset-0 bg-amber-300/40 pointer-events-none" />
                      )}

                      {isSelected && (
                        <motion.span
                          layoutId="chess-selected"
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            boxShadow:
                              'inset 0 0 0 3px rgba(212,175,55,0.95), inset 0 0 20px rgba(212,175,55,0.35)',
                            background: 'rgba(212,175,55,0.18)',
                          }}
                        />
                      )}

                      {isCheckSq && (
                        <motion.span
                          className="absolute inset-0 pointer-events-none bg-red-500/40"
                          animate={{ opacity: [0.35, 0.7, 0.35] }}
                          transition={{ duration: 0.9, repeat: Infinity }}
                        />
                      )}

                      {isHover && !isSelected && !disabled && (
                        <span
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'rgba(255,255,255,0.14)',
                            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)',
                          }}
                        />
                      )}

                      {isHint && !isCapture && (
                        <motion.span
                          className="absolute w-[24%] h-[24%] rounded-full pointer-events-none z-[2]"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                          style={{
                            background:
                              'radial-gradient(circle, rgba(245,220,140,0.95) 0%, rgba(212,175,55,0.5) 55%, transparent 72%)',
                            boxShadow: '0 0 10px rgba(212,175,55,0.55)',
                          }}
                        />
                      )}

                      {isCapture && (
                        <motion.span
                          className="absolute inset-[12%] rounded-full pointer-events-none z-[2]"
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: [1, 1.04, 1], opacity: 1 }}
                          transition={{ duration: 1.1, repeat: Infinity }}
                          style={{
                            border: '2.5px solid rgba(220,80,60,0.85)',
                            boxShadow: '0 0 12px rgba(220,80,60,0.45)',
                          }}
                        />
                      )}

                      {piece && (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-1/2 top-1/2 w-[84%]"
                          style={{
                            /* Foot planted at square center; billboard around base */
                            aspectRatio: '1 / 1.12',
                            zIndex: 20 + displayRow,
                            transform: `translate(-50%, -100%) rotateX(-${BOARD_TILT}deg) translateZ(6px)`,
                            transformOrigin: '50% 100%',
                            transformStyle: 'preserve-3d',
                          }}
                        >
                          <ChessPiece
                            type={piece.type}
                            color={piece.color}
                            selected={isSelected}
                            capturing={isCaptureAnim}
                            promoting={isPromote}
                          />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Flying piece — same square-center seating as static pieces */}
            <AnimatePresence>
              {animating && animFromDisplay && animToDisplay && (
                <motion.div
                  key={`${animating.from.row}-${animating.from.col}-${animating.to.row}-${animating.to.col}`}
                  className="absolute left-0 top-0 pointer-events-none"
                  style={{
                    width: `${cellPct}%`,
                    height: `${cellPct}%`,
                    zIndex: 40,
                    transformStyle: 'preserve-3d',
                  }}
                  initial={{
                    x: `${animFromDisplay.col * 100}%`,
                    y: `${animFromDisplay.row * 100}%`,
                  }}
                  animate={{
                    x: `${animToDisplay.col * 100}%`,
                    y: `${animToDisplay.row * 100}%`,
                  }}
                  transition={{ duration: MOVE_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.span
                    className="absolute left-1/2 top-1/2 w-[84%]"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: MOVE_MS / 1000, ease: 'easeOut' }}
                    style={{
                      aspectRatio: '1 / 1.12',
                      transform: `translate(-50%, -100%) rotateX(-${BOARD_TILT}deg) translateZ(18px)`,
                      transformOrigin: '50% 100%',
                      transformStyle: 'preserve-3d',
                      filter: 'drop-shadow(0 18px 14px rgba(0,0,0,0.5))',
                    }}
                  >
                    <ChessPiece type={animating.piece.type} color={animating.piece.color} lifted />
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
