'use client';

import { SlotSymbol } from './SlotSymbol';
import type { FruitSlotsHistoryItem } from '../types';

interface SpinHistoryProps {
  items: FruitSlotsHistoryItem[];
}

export function SpinHistory({ items }: SpinHistoryProps) {
  return (
    <section className="cfs-panel">
      <h2>Spin History</h2>
      <p className="cfs-panel-sub">Latest server-settled spins</p>
      <div className="cfs-history">
        {items.length === 0 && <p className="cfs-empty">No spins yet. Pull the lever.</p>}
        {items.map((item) => (
          <article key={item.spinId} className="cfs-history-item">
            <div className="cfs-history-reels">
              {item.reels[1]?.map((symbol, index) => (
                <SlotSymbol key={`${item.spinId}-${index}`} type={symbol} compact />
              ))}
            </div>
            <div className="cfs-history-meta">
              <span>Bet {item.bet}</span>
              <strong className={item.winAmount > 0 ? 'is-win' : ''}>
                {item.winAmount > 0 ? `+${item.winAmount}` : '—'}
              </strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
