'use client';

import { motion } from 'framer-motion';
import { ChessPiece } from '@/components/game/chess/ChessPiece';
import { Button } from '@/components/ui/Button';
import type { ChessColor, ChessPieceType } from '../types';
import { SvgPiece } from './SvgPieces';

const OPTIONS: ChessPieceType[] = ['queen', 'rook', 'bishop', 'knight'];

interface ChessPromotionDialogProps {
  color: ChessColor;
  pieceStyle: 'royal' | 'classic';
  onSelect: (type: ChessPieceType) => void;
  onCancel: () => void;
}

export function ChessPromotionDialog({ color, pieceStyle, onSelect, onCancel }: ChessPromotionDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'var(--overlay)' }}>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="surface-card w-full max-w-sm rounded-3xl p-5"
        role="dialog"
        aria-label="Choose promotion piece"
      >
        <p className="text-[11px] uppercase tracking-[0.18em] text-theme-muted font-semibold mb-1">Promotion</p>
        <h3 className="font-display text-xl font-bold text-theme-primary mb-4">Choose a piece</h3>
        <div className="grid grid-cols-4 gap-2">
          {OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className="aspect-square rounded-2xl border border-theme bg-theme-secondary hover:border-primary-500 hover:bg-primary-500/10 transition-colors p-2"
              aria-label={`Promote to ${type}`}
            >
              {pieceStyle === 'classic' ? (
                <SvgPiece type={type} color={color} />
              ) : (
                <ChessPiece type={type} color={color} />
              )}
            </button>
          ))}
        </div>
        <Button variant="ghost" className="w-full mt-4" onClick={onCancel}>
          Cancel
        </Button>
      </motion.div>
    </div>
  );
}
