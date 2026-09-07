'use client';

import { coilAudio } from '../audio/audioService';
import { useState } from 'react';

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [muted, setMuted] = useState(coilAudio.isMuted());
  const [music, setMusic] = useState(coilAudio.isMusicOn());

  return (
    <section className="coil-screen">
      <button type="button" className="coil-back" onClick={onBack}>Back</button>
      <h2>Settings</h2>
      <label className="coil-toggle">
        <input
          type="checkbox"
          checked={!muted}
          onChange={(e) => {
            coilAudio.setMuted(!e.target.checked);
            setMuted(!e.target.checked);
          }}
        />
        Sound effects
      </label>
      <label className="coil-toggle">
        <input
          type="checkbox"
          checked={music}
          onChange={(e) => {
            coilAudio.setMusic(e.target.checked);
            setMusic(e.target.checked);
          }}
        />
        Music bed (architecture ready)
      </label>
      <p className="coil-empty">Mouse steers. WASD or arrows also work. Hold click or Space to boost.</p>
    </section>
  );
}
