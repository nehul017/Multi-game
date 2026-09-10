'use client';

import { motion } from 'framer-motion';
import type { AudioSettings, GraphicsQuality } from '../types';

const QUALITIES: GraphicsQuality[] = ['low', 'medium', 'high', 'ultra'];

interface SettingsPanelProps {
  audio: AudioSettings;
  quality: GraphicsQuality;
  onMuted: (muted: boolean) => void;
  onSound: (volume: number) => void;
  onMusic: (volume: number) => void;
  onQuality: (quality: GraphicsQuality) => void;
  onBack: () => void;
}

export function SettingsPanel({
  audio,
  quality,
  onMuted,
  onSound,
  onMusic,
  onQuality,
  onBack,
}: SettingsPanelProps) {
  return (
    <div className="bs-overlay">
      <motion.section
        className="bs-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="bs-kicker">Range Settings</p>
        <h2>Settings</h2>
        <p className="bs-copy">Graphics</p>
        <div className="bs-quality" role="group" aria-label="Graphics quality">
          {QUALITIES.map((item) => (
            <button
              key={item}
              type="button"
              className={`bs-quality-btn${quality === item ? ' is-on' : ''}`}
              onClick={() => onQuality(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="bs-toggle">
          <span>Mute All</span>
          <input type="checkbox" checked={audio.muted} onChange={(e) => onMuted(e.target.checked)} />
        </label>
        <label className="bs-slider">
          <span>Sound Effects</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={audio.soundVolume}
            onChange={(e) => onSound(Number(e.target.value))}
            disabled={audio.muted}
          />
        </label>
        <label className="bs-slider">
          <span>Music & Ambience</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={audio.musicVolume}
            onChange={(e) => onMusic(Number(e.target.value))}
            disabled={audio.muted}
          />
        </label>
        <motion.button
          type="button"
          className="bs-cta"
          onClick={onBack}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Done
        </motion.button>
      </motion.section>
    </div>
  );
}
