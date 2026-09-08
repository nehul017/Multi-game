'use client';

import type { ReactNode } from 'react';

interface MachineButtonProps {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function MachineButton({ label, icon, active = false, disabled = false, onClick }: MachineButtonProps) {
  return (
    <button
      type="button"
      className={`cfs-deck-btn${active ? ' is-active' : ''}`}
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
