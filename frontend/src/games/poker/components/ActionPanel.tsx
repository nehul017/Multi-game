'use client';

import { useMemo, useState } from 'react';
import type { AllowedAction, PokerActionType } from '../types';
import { BetControls } from './BetControls';

interface ActionPanelProps {
  actions: AllowedAction[];
  pot: number;
  disabled?: boolean;
  drawPhase?: boolean;
  discardCount?: number;
  onAction: (type: PokerActionType, amount?: number) => void;
  onDraw: () => void;
  idleLabel?: string;
}

export function ActionPanel({
  actions,
  pot,
  disabled,
  drawPhase,
  discardCount = 0,
  onAction,
  onDraw,
  idleLabel = 'Waiting for the table…',
}: ActionPanelProps) {
  const raise = actions.find((action) => action.type === 'raise' || action.type === 'bet');
  const [amount, setAmount] = useState(raise?.min || 0);

  const amountReady = useMemo(() => {
    if (!raise) return 0;
    return Math.min(raise.max || amount, Math.max(raise.min || 0, amount));
  }, [amount, raise]);

  if (drawPhase) {
    return (
      <div className="pk-actions">
        <button type="button" className="pk-action is-gold" onClick={onDraw} disabled={disabled}>
          {discardCount === 0 ? 'Stand pat' : `Draw ${discardCount}`}
        </button>
      </div>
    );
  }

  if (actions.length === 0) {
    return <div className="pk-actions is-idle">{idleLabel}</div>;
  }

  return (
    <div className="pk-actions">
      {raise && (
        <BetControls
          value={amountReady || raise.min || 0}
          min={raise.min || 1}
          max={raise.max || raise.min || 1}
          pot={pot}
          onChange={setAmount}
        />
      )}
      <div className="pk-action-row">
        {actions.map((action) => {
          if (action.type === 'bet' || action.type === 'raise') {
            return (
              <button
                key={action.type}
                type="button"
                className="pk-action is-gold"
                disabled={disabled}
                onClick={() => onAction(action.type, amountReady)}
              >
                {action.type === 'bet' ? `Bet ${amountReady}` : `Raise to ${amountReady}`}
              </button>
            );
          }
          return (
            <button
              key={action.type}
              type="button"
              className={`pk-action is-${action.type}`}
              disabled={disabled}
              onClick={() => onAction(action.type, action.amount)}
            >
              {action.type === 'call' && action.amount ? `Call ${action.amount}` : action.type.replace('-', ' ')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
