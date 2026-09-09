'use client';

import { useCallback, useRef, useState, type PointerEvent } from 'react';
import { TAB, type JigsawPiece, type JigsawPuzzleDef } from '../types';
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
  const boardRef = useRef<HTMLDivElement>(null);
  const grabRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

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

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, piece: JigsawPiece) => {
    if (disabled || piece.placed) return;
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const bodyLeft = rect.left + piece.x * rect.width;
    const bodyTop = rect.top + piece.y * rect.height;
    grabRef.current = { id: piece.id, dx: event.clientX - bodyLeft, dy: event.clientY - bodyTop };
    setDragId(piece.id);
    onLift(piece.id);
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const grab = grabRef.current;
    if (!grab) return;
    const next = readPoint(event.clientX, event.clientY, grab.dx, grab.dy);
    if (!next) return;
    onMove(grab.id, next.x, next.y);
  };

  const endDrag = () => {
    const grab = grabRef.current;
    if (!grab) return;
    grabRef.current = null;
    setDragId(null);
    onDrop(grab.id);
  };

  const cellW = 100 / cols;
  const cellH = 100 / rows;

  return (
    <div className="jw-table">
      <div
        ref={boardRef}
        className="jw-board"
        role="application"
        aria-label={`${puzzle.title} jigsaw board`}
      >
        <div
          className={`jw-ghost ${showPreview ? 'is-on' : ''}`}
          style={{ backgroundImage: `url(${puzzle.src})` }}
        />
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
        {pieces
          .slice()
          .sort((a, b) => a.z - b.z)
          .map((piece) => (
            <button
              key={piece.id}
              type="button"
              className={`jw-piece ${piece.placed ? 'is-placed' : ''} ${dragId === piece.id ? 'is-drag' : ''}`}
              style={{
                left: `calc(${piece.x * 100}% - ${TAB * cellW}%)`,
                top: `calc(${piece.y * 100}% - ${TAB * cellH}%)`,
                width: `${cellW * (1 + TAB * 2)}%`,
                height: `${cellH * (1 + TAB * 2)}%`,
                zIndex: piece.placed ? 1 : piece.z + 2,
              }}
              disabled={disabled || piece.placed}
              aria-label={`Piece ${piece.col + 1}, ${piece.row + 1}${piece.placed ? ' placed' : ''}`}
              onPointerDown={(event) => onPointerDown(event, piece)}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <JigsawPieceView
                piece={piece}
                cols={cols}
                rows={rows}
                src={puzzle.src}
                highlighted={Boolean(hintSlot && hintSlot.col === piece.col && hintSlot.row === piece.row && !piece.placed)}
                dragging={dragId === piece.id}
              />
            </button>
          ))}
      </div>
    </div>
  );
}
