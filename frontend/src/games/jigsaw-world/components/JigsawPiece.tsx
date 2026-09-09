'use client';

import { TAB, type JigsawPiece as Piece } from '../types';
import { piecePath } from '../pieces';

interface JigsawPieceViewProps {
  piece: Piece;
  cols: number;
  rows: number;
  src: string;
  highlighted?: boolean;
  dragging?: boolean;
}

export function JigsawPieceView({ piece, cols, rows, src, highlighted, dragging }: JigsawPieceViewProps) {
  const path = piecePath(piece.edges);
  const clipId = `jw-clip-${piece.id}`;
  const view = `${-TAB} ${-TAB} ${1 + TAB * 2} ${1 + TAB * 2}`;

  return (
    <svg
      className={`jw-piece-svg ${piece.placed ? 'is-placed' : ''} ${highlighted ? 'is-hint' : ''} ${dragging ? 'is-drag' : ''}`}
      viewBox={view}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <path d={path} />
        </clipPath>
      </defs>
      <image
        href={src}
        x={-piece.col}
        y={-piece.row}
        width={cols}
        height={rows}
        preserveAspectRatio="none"
        clipPath={`url(#${clipId})`}
      />
      <path className="jw-piece-stroke" d={path} />
    </svg>
  );
}
