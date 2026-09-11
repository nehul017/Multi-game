'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { TAB, isInTray, type JigsawPiece, type JigsawPuzzleDef } from '../types';
import { JigsawPieceView } from './JigsawPiece';

interface JigsawBoardProps {
  puzzle: JigsawPuzzleDef;
  pieces: JigsawPiece[];
  cols: number;
  rows: number;
  showPreview: boolean;
  hintSlot: { col: number; row: number } | null;
  disabled?: boolean;
  onLift: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDrop: (id: string) => void;
}

export function JigsawBoard({
  puzzle,
  pieces,
  cols,
  rows,
  showPreview,
  hintSlot,
  disabled,
  onLift,
  onMove,
  onDrop,
}: JigsawBoardProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const grabRef = useRef<{ id: string; dx: number; dy: number; origin: 'tray' | 'board' } | null>(null);
  const moveRef = useRef(onMove);
  const dropRef = useRef(onDrop);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOrigin, setDragOrigin] = useState<'tray' | 'board' | null>(null);
  const [dragBox, setDragBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [boardSize, setBoardSize] = useState({ w: 320, h: 240 });

  moveRef.current = onMove;
  dropRef.current = onDrop;

  const cellW = 100 / cols;
  const cellH = 100 / rows;

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return undefined;
    const fit = (width: number, height: number) => {
      const ratio = 4 / 3;
      let w = width;
      let h = w / ratio;
      if (h > height) {
        h = height;
        w = h * ratio;
      }
      setBoardSize({ w: Math.max(160, w), h: Math.max(120, h) });
    };
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      fit(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(table);
    fit(table.clientWidth, table.clientHeight);
    return () => observer.disconnect();
  }, []);

  const readPoint = useCallback((clientX: number, clientY: number, dx: number, dy: number) => {
    const board = boardRef.current;
    if (!board) return null;
    const rect = board.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return null;
    return {
      x: (clientX - dx - rect.left) / rect.width,
      y: (clientY - dy - rect.top) / rect.height,
    };
  }, []);

  const pieceBox = useCallback(() => {
    const board = boardRef.current;
    if (!board) return { w: 80, h: 60, tabX: 12, tabY: 9 };
    const rect = board.getBoundingClientRect();
    const unitW = rect.width / cols;
    const unitH = rect.height / rows;
    return {
      w: unitW * (1 + TAB * 2),
      h: unitH * (1 + TAB * 2),
      tabX: TAB * unitW,
      tabY: TAB * unitH,
    };
  }, [cols, rows]);

  const beginDrag = (event: ReactPointerEvent<HTMLButtonElement>, piece: JigsawPiece) => {
    if (disabled || piece.placed) return;
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const box = pieceBox();
    let dx: number;
    let dy: number;

    if (isInTray(piece)) {
      const pieceRect = event.currentTarget.getBoundingClientRect();
      const relX = (event.clientX - pieceRect.left) / Math.max(1, pieceRect.width);
      const relY = (event.clientY - pieceRect.top) / Math.max(1, pieceRect.height);
      dx = relX * box.w - box.tabX;
      dy = relY * box.h - box.tabY;
    } else {
      dx = event.clientX - (rect.left + piece.x * rect.width);
      dy = event.clientY - (rect.top + piece.y * rect.height);
    }

    grabRef.current = { id: piece.id, dx, dy, origin: isInTray(piece) ? 'tray' : 'board' };
    setDragOrigin(isInTray(piece) ? 'tray' : 'board');
    setDragId(piece.id);
    setDragBox({
      x: event.clientX - dx - box.tabX,
      y: event.clientY - dy - box.tabY,
      w: box.w,
      h: box.h,
    });
    onLift(piece.id);

    const track = (moveEvent: MouseEvent) => {
      const grab = grabRef.current;
      if (!grab) return;
      const nextBox = pieceBox();
      setDragBox({
        x: moveEvent.clientX - grab.dx - nextBox.tabX,
        y: moveEvent.clientY - grab.dy - nextBox.tabY,
        w: nextBox.w,
        h: nextBox.h,
      });
      const next = readPoint(moveEvent.clientX, moveEvent.clientY, grab.dx, grab.dy);
      if (next) moveRef.current(grab.id, next.x, next.y);
    };

    const finish = () => {
      window.removeEventListener('pointermove', track, true);
      window.removeEventListener('mousemove', track, true);
      window.removeEventListener('pointerup', finish, true);
      window.removeEventListener('pointercancel', finish, true);
      window.removeEventListener('mouseup', finish, true);
      const grab = grabRef.current;
      if (!grab) return;
      grabRef.current = null;
      setDragId(null);
      setDragOrigin(null);
      setDragBox(null);
      dropRef.current(grab.id);
    };

    window.addEventListener('pointermove', track, true);
    window.addEventListener('mousemove', track, true);
    window.addEventListener('pointerup', finish, true);
    window.addEventListener('pointercancel', finish, true);
    window.addEventListener('mouseup', finish, true);
    const start = readPoint(event.clientX, event.clientY, dx, dy);
    if (start) moveRef.current(piece.id, start.x, start.y);
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Automation and some browsers can reject capture; window listeners still end the drag.
    }
  };

  const boardPieces = useMemo(
    () =>
      pieces
        .filter((piece) => {
          if (piece.id === dragId) return dragOrigin === 'board';
          return piece.placed || !isInTray(piece);
        })
        .slice()
        .sort((a, b) => a.z - b.z),
    [dragId, dragOrigin, pieces]
  );

  const trayPieces = useMemo(
    () =>
      pieces.filter((piece) => {
        if (piece.id === dragId) return dragOrigin === 'tray';
        return isInTray(piece);
      }),
    [dragId, dragOrigin, pieces]
  );

  const dragPiece = dragId ? pieces.find((piece) => piece.id === dragId) : null;

  useEffect(() => {
    if (!hintSlot) return;
    const node = trayRef.current?.querySelector<HTMLElement>(`[data-slot="${hintSlot.col}-${hintSlot.row}"]`);
    node?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [hintSlot]);

  const renderPiece = (piece: JigsawPiece, tray: boolean) => {
    const hinted = Boolean(hintSlot && hintSlot.col === piece.col && hintSlot.row === piece.row && !piece.placed);
    return (
      <button
        key={piece.id}
        type="button"
        data-slot={`${piece.col}-${piece.row}`}
        className={`jw-piece ${piece.placed ? 'is-placed' : ''} ${tray ? 'is-tray' : ''} ${hinted ? 'is-hinted' : ''} ${dragId === piece.id ? 'is-source' : ''}`}
        style={
          tray
            ? undefined
            : {
                left: `calc(${piece.x * 100}% - ${TAB * cellW}%)`,
                top: `calc(${piece.y * 100}% - ${TAB * cellH}%)`,
                width: `${cellW * (1 + TAB * 2)}%`,
                height: `${cellH * (1 + TAB * 2)}%`,
                zIndex: piece.placed ? 1 : piece.z + 2,
              }
        }
        disabled={disabled || piece.placed}
        aria-label={`Piece ${piece.col + 1}, ${piece.row + 1}${piece.placed ? ' placed' : ''}`}
        onPointerDown={(event) => beginDrag(event, piece)}
      >
        <JigsawPieceView piece={piece} cols={cols} rows={rows} src={puzzle.src} highlighted={hinted} />
      </button>
    );
  };

  return (
    <div className="jw-play">
      <div ref={tableRef} className="jw-table">
        <div
          ref={boardRef}
          className="jw-board"
          role="application"
          aria-label={`${puzzle.title} jigsaw board`}
          style={{ width: boardSize.w, height: boardSize.h }}
        >
          <div className={`jw-ghost ${showPreview ? 'is-on' : ''}`} style={{ backgroundImage: `url(${puzzle.src})` }} />
          {hintSlot && (
            <div
              className="jw-hint"
              style={{
                left: `${(hintSlot.col / cols) * 100}%`,
                top: `${(hintSlot.row / rows) * 100}%`,
                width: `${cellW}%`,
                height: `${cellH}%`,
              }}
            />
          )}
          {boardPieces.map((piece) => renderPiece(piece, false))}
        </div>
      </div>

      <div className="jw-tray" aria-label="Loose pieces">
        <div className="jw-tray-meta">
          <span>Pieces</span>
          <b>{trayPieces.filter((piece) => piece.id !== dragId).length}</b>
        </div>
        <div ref={trayRef} className="jw-tray-track">
          {trayPieces.length === 0 ? (
            <p className="jw-tray-empty">{pieces.every((piece) => piece.placed) ? 'Puzzle complete' : 'All pieces are on the board'}</p>
          ) : (
            trayPieces.map((piece) => renderPiece(piece, true))
          )}
        </div>
      </div>

      {dragPiece && dragBox && (
        <div
          className="jw-piece is-drag is-float"
          style={{
            left: dragBox.x,
            top: dragBox.y,
            width: dragBox.w,
            height: dragBox.h,
          }}
        >
          <JigsawPieceView piece={dragPiece} cols={cols} rows={rows} src={puzzle.src} dragging />
        </div>
      )}
    </div>
  );
}
