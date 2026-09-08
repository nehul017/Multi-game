'use client';

import { SlotSymbol } from './SlotSymbol';
import type { PublicSymbol } from '../types';

interface PaytableProps {
  symbols: readonly PublicSymbol[];
  bet: number;
}

export function Paytable({ symbols, bet }: PaytableProps) {
  return (
    <section className="cfs-panel">
      <h2>Paytable</h2>
      <p className="cfs-panel-sub">Payouts at current bet {bet}</p>
      <div className="cfs-paytable">
        {symbols.map((symbol) => (
          <div key={symbol.id} className="cfs-pay-row">
            <SlotSymbol type={symbol.id} compact />
            <div className="cfs-pay-meta">
              <strong>{symbol.name}</strong>
              <span className="cfs-rarity">{symbol.rarity}</span>
            </div>
            <div className="cfs-pay-mults">
              <span>3x {bet * symbol.payouts[3]}</span>
              <span>4x {bet * symbol.payouts[4]}</span>
              <span>5x {bet * symbol.payouts[5]}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
