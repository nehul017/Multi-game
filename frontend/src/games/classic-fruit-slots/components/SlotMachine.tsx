'use client';

import { ControlDeck } from './ControlDeck';
import { MachineMarquee } from './MachineMarquee';
import { Paytable } from './Paytable';
import { ReelWindow } from './ReelWindow';
import { SpinHistory } from './SpinHistory';
import { StatusPanel } from './StatusPanel';
import type { FruitSlotsHistoryItem, PublicPayline, PublicSymbol, ReelGrid, WinningLine } from '../types';

interface SlotMachineProps {
  reels: ReelGrid;
  resultReels: ReelGrid | null;
  spinning: boolean;
  winning: boolean;
  winningLines: WinningLine[];
  paylines: readonly PublicPayline[];
  symbols: readonly PublicSymbol[];
  history: FruitSlotsHistoryItem[];
  winAmount: number;
  showWinBurst: boolean;
  balance: number;
  bet: number;
  lastWin: number;
  connected: boolean;
  locked: boolean;
  autoSpin: boolean;
  panel: 'paytable' | 'history' | null;
  minBet: number;
  maxBet: number;
  step: number;
  presets: readonly number[];
  onBetChange: (next: number) => void;
  onSpin: () => void;
  onAllStopped: () => void;
  onToggleAuto: () => void;
  onTogglePanel: (panel: 'paytable' | 'history') => void;
  onClosePanel: () => void;
}

export function SlotMachine({
  reels,
  resultReels,
  spinning,
  winning,
  winningLines,
  paylines,
  symbols,
  history,
  winAmount,
  showWinBurst,
  balance,
  bet,
  lastWin,
  connected,
  locked,
  autoSpin,
  panel,
  minBet,
  maxBet,
  step,
  presets,
  onBetChange,
  onSpin,
  onAllStopped,
  onToggleAuto,
  onTogglePanel,
  onClosePanel,
}: SlotMachineProps) {
  return (
    <div className="cfs-scene">
      <div className={`cfs-machine${winning ? ' is-winning' : ''}${spinning ? ' is-live' : ''}`}>
        <div className="cfs-machine-side cfs-machine-side-left" aria-hidden />
        <div className="cfs-cabinet">
          <div className="cfs-cabinet-liner" aria-hidden />
          <MachineMarquee />
          <StatusPanel balance={balance} bet={bet} lastWin={lastWin} connected={connected} />
          <ReelWindow
            reels={reels}
            resultReels={resultReels}
            spinning={spinning}
            winningLines={winningLines}
            paylines={paylines}
            winAmount={winAmount}
            showWinBurst={showWinBurst}
            onAllStopped={onAllStopped}
          />
          <ControlDeck
            bet={bet}
            minBet={minBet}
            maxBet={maxBet}
            step={step}
            presets={presets}
            locked={locked}
            spinning={spinning}
            autoSpin={autoSpin}
            panel={panel}
            onBetChange={onBetChange}
            onSpin={onSpin}
            onToggleAuto={onToggleAuto}
            onTogglePanel={onTogglePanel}
          />
          {panel && (
            <div className="cfs-plate" role="dialog" aria-modal="true" aria-label={panel}>
              <button type="button" className="cfs-plate-close" onClick={onClosePanel}>
                Close
              </button>
              {panel === 'paytable' ? <Paytable symbols={symbols} bet={bet} /> : <SpinHistory items={history} />}
            </div>
          )}
        </div>
        <div className="cfs-machine-side cfs-machine-side-right" aria-hidden />
      </div>
    </div>
  );
}
