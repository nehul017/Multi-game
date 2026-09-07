'use client';

import { useState } from 'react';
import { ChessSettingsPanel } from '../components/ChessSettingsPanel';
import { chessSettings } from '../storage/settings';
import type { ChessSettings } from '../types';

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [settings, setSettings] = useState<ChessSettings>(chessSettings.get());

  return (
    <section className="cx-screen">
      <button type="button" className="cx-back" onClick={onBack}>Back</button>
      <h2>Settings</h2>
      <p className="text-theme-muted mb-4">Board, sound, and motion — saved on this device.</p>
      <ChessSettingsPanel
        open
        settings={settings}
        onChange={(next) => setSettings(chessSettings.set(next))}
        onClose={onBack}
      />
    </section>
  );
}
