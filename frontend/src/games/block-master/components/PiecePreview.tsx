'use client';

import { SHAPES } from '../logic';
import type { PieceType } from '../types';
import { cn } from '@/lib/utils';

interface PiecePreviewProps {
  type: PieceType | null;
  label: string;
  muted?: boolean;
}

export function PiecePreview({ type, label, muted = false }: PiecePreviewProps) {
  const matrix = type ? SHAPES[type][0] : [];
  const cols = matrix[0]?.length || 4;
  const rows = matrix.length || 2;

  return (
    <section className={cn('bm-panel', muted && 'is-muted')} aria-label={label}>
      <p className="bm-panel-label">{label}</p>
      <div
        className="bm-preview"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${Math.max(rows, 2)}, 1fr)`,
        }}
        aria-hidden={!type}
      >
        {type
          ? matrix.flat().map((filled, index) => (
              <span
                key={`${type}-${index}`}
                className={cn('bm-preview-cell', filled && 'is-filled')}
                data-type={filled ? type : undefined}
              />
            ))
          : Array.from({ length: 8 }, (_, index) => (
              <span key={index} className="bm-preview-cell" />
            ))}
      </div>
    </section>
  );
}
