'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';
import { SymbolArt, SYMBOL_LABELS } from '../assets/symbols';
import type { SymbolId } from '../types';

interface SlotSymbolProps {
  id?: SymbolId;
  type?: SymbolId;
  winning?: boolean;
  dimmed?: boolean;
  compact?: boolean;
}

export function SlotSymbol({
  id,
  type,
  winning = false,
  dimmed = false,
  compact = false,
}: SlotSymbolProps) {
  const symbol = type || id;
  const uid = useId().replace(/:/g, '');
  if (!symbol) return null;

  return (
    <div
      className={cn(
        'cfs-symbol',
        winning && 'cfs-symbol-win',
        dimmed && 'cfs-symbol-dim',
        compact && 'cfs-symbol-compact'
      )}
    >
      <SymbolArt id={symbol} uid={uid} className="cfs-symbol-art" />
      <span className="sr-only">{SYMBOL_LABELS[symbol]}</span>
    </div>
  );
}
