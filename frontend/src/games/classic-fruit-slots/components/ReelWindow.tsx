'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PaylineIndicator } from './PaylineIndicator';
import { PaylineOverlay } from './PaylineOverlay';
import { Reel } from './Reel';
import { WinOverlay } from './WinOverlay';
import type { PublicPayline, ReelGrid, SymbolId, WinningLine } from '../types';

interface ReelWindowProps {
  reels: ReelGrid;
  resultReels: ReelGrid | null;
  spinning: boolean;
  winningLines: WinningLine[];
  paylines: readonly PublicPayline[];
  winAmount: number;
  showWinBurst: boolean;
  onAllStopped: () => void;
}

function columnOf(grid: ReelGrid, reel: number): SymbolId[] {
  return grid.map((row) => row[reel]);
}

export function ReelWindow({
  reels,
  resultReels,
  spinning,
  winningLines,
  paylines,
  winAmount,
  showWinBurst,
  onAllStopped,
}: ReelWindowProps) {
  const [stoppedCount, setStoppedCount] = useState(0);

  useEffect(() => {
    if (spinning) setStoppedCount(0);
  }, [spinning]);

  const winningByReel = useMemo(() => {
    const map: number[][] = [[], [], [], [], []];
    for (const line of winningLines) {
      for (const cell of line.cells) {
        if (!map[cell.reel].includes(cell.row)) map[cell.reel].push(cell.row);
      }
    }
    return map;
  }, [winningLines]);

  const handleStopped = useCallback(() => {
    setStoppedCount((count) => {
      const next = count + 1;
      if (next >= 5) onAllStopped();
      return next;
    });
  }, [onAllStopped]);

  const showWin = (!spinning || stoppedCount >= 5) && winningLines.length > 0;

  return (
    <div className={`cfs-chamber${spinning ? ' is-spinning' : ''}${showWin ? ' is-winning' : ''}`}>
      <div className="cfs-chamber-bezel" />
      <PaylineIndicator side="left" paylines={paylines} winningLines={showWin ? winningLines : []} />
      <div className="cfs-chamber-well">
        <div className="cfs-reels">
          {Array.from({ length: 5 }, (_, reel) => (
            <Reel
              key={reel}
              column={columnOf(reels, reel)}
              resultColumn={resultReels ? columnOf(resultReels, reel) : undefined}
              spinning={spinning}
              stopDelayMs={480 + reel * 320}
              winningRows={winningByReel[reel] || []}
              showWin={showWin}
              onStopped={handleStopped}
            />
          ))}
        </div>
        <PaylineOverlay
          paylines={paylines}
          winningLines={showWin ? winningLines : []}
          reelCount={5}
          rowCount={3}
        />
        <div className="cfs-glass" />
        <WinOverlay visible={showWinBurst && showWin} amount={winAmount} intense={winAmount >= 200} />
      </div>
      <PaylineIndicator side="right" paylines={paylines} winningLines={showWin ? winningLines : []} />
    </div>
  );
}
