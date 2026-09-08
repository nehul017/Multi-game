'use client';

import { MachineDisplay } from './MachineDisplay';

interface StatusPanelProps {
  balance: number;
  bet: number;
  lastWin: number;
  connected: boolean;
}

export function StatusPanel({ balance, bet, lastWin, connected }: StatusPanelProps) {
  return (
    <section className="cfs-status-panel" aria-label="Machine meters">
      <MachineDisplay label="Balance" value={balance} tone="green" live={connected} />
      <MachineDisplay label="Current Bet" value={bet} tone="gold" />
      <MachineDisplay label="Last Win" value={lastWin} tone="red" />
    </section>
  );
}
