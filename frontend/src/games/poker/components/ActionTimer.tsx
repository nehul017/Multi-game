'use client';

import { useEffect, useState } from 'react';

export function ActionTimer({ deadline, active }: { deadline: number | null; active: boolean }) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!deadline) {
      setLeft(0);
      return;
    }
    const tick = () => setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [deadline]);

  if (!active || !deadline) return null;
  const warning = left <= 10;
  const danger = left <= 5;

  return (
    <div className={`pk-timer ${warning ? 'is-warn' : ''} ${danger ? 'is-danger' : ''}`}>
      <span className="pk-timer-ring" style={{ ['--pk-left' as string]: `${Math.min(100, (left / 15) * 100)}%` }} />
      <span>YOUR TURN</span>
      <strong>{left}s</strong>
    </div>
  );
}
