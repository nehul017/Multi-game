'use client';

import { History, Table2, Zap } from 'lucide-react';
import { fruitSlotsAudio } from '../audio';
import { BetControls } from './BetControls';
import { MachineButton } from './MachineButton';
import { SpinButton } from './SpinButton';

interface ControlDeckProps {
  bet: number;
  minBet: number;
  maxBet: number;
  step: number;
  presets: readonly number[];
  locked: boolean;
  spinning: boolean;
  autoSpin: boolean;
  panel: 'paytable' | 'history' | null;
  onBetChange: (next: number) => void;
  onSpin: () => void;
  onToggleAuto: () => void;
  onTogglePanel: (panel: 'paytable' | 'history') => void;
}

export function ControlDeck({
  bet,
  minBet,
  maxBet,
  step,
  presets,
  locked,
  spinning,
  autoSpin,
  panel,
  onBetChange,
  onSpin,
  onToggleAuto,
  onTogglePanel,
}: ControlDeckProps) {
  return (
    <section className="cfs-deck">
      <div className="cfs-deck-aux">
        <MachineButton
          label="Auto Spin"
          icon={<Zap className="w-3.5 h-3.5" />}
          active={autoSpin}
          onClick={onToggleAuto}
        />
        <MachineButton
          label="Paytable"
          icon={<Table2 className="w-3.5 h-3.5" />}
          active={panel === 'paytable'}
          onClick={() => {
            fruitSlotsAudio.play('click');
            onTogglePanel('paytable');
          }}
        />
        <MachineButton
          label="History"
          icon={<History className="w-3.5 h-3.5" />}
          active={panel === 'history'}
          onClick={() => {
            fruitSlotsAudio.play('click');
            onTogglePanel('history');
          }}
        />
      </div>
      <div className="cfs-deck-main">
        <BetControls
          bet={bet}
          minBet={minBet}
          maxBet={maxBet}
          step={step}
          presets={presets}
          disabled={locked}
          onChange={onBetChange}
        />
        <SpinButton disabled={locked} spinning={spinning} onSpin={onSpin} />
      </div>
    </section>
  );
}
