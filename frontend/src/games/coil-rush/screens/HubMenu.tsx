'use client';

import { motion } from 'framer-motion';
import { COIL_BRAND } from '../brand';
import { coilAudio } from '../audio/audioService';
import { COIL_FEATURED_SKINS, COIL_MODES } from '../config';
import { skinById } from '../progression/skins';
import type { CoilMode, CoilView } from '../types';

interface HubMenuProps {
  username?: string;
  coins?: number;
  dailyReady?: boolean;
  mode: CoilMode;
  skin: string;
  onPlay: () => void;
  onOpen: (view: CoilView) => void;
  onDaily: () => void;
  onDashboard: () => void;
  onMode: (mode: CoilMode) => void;
  onSkin: (id: string) => void;
}

export function HubMenu({
  username,
  coins,
  dailyReady,
  mode,
  skin,
  onPlay,
  onOpen,
  onDaily,
  onDashboard,
  onMode,
  onSkin,
}: HubMenuProps) {
  const equipped = skinById(skin);

  return (
    <div className="coil-hub">
      <div className="coil-hub-orbs" aria-hidden />
      <header className="coil-hub-top">
        <button type="button" className="coil-back" onClick={onDashboard}>
          ← Back to Games
        </button>
        <div className="coil-hub-meta">
          <button type="button" className="coil-chip" onClick={() => onOpen('profile')}>
            {username || 'Rider'}
          </button>
          <span className="coil-chip">{coins ?? 0} coins</span>
        </div>
      </header>
      <motion.div className="coil-logo-wrap" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="coil-mascot" style={{ background: `conic-gradient(from 120deg, ${equipped.color}, ${equipped.accent}, ${equipped.color})` }} aria-hidden />
        <p className="coil-kicker">Arcade multiplayer</p>
        <h1>{COIL_BRAND.name}</h1>
        <p>{COIL_BRAND.tagline}</p>
      </motion.div>

      <div className="coil-landing-panel">
        <label className="coil-label">Skin</label>
        <div className="coil-skin-row">
          {COIL_FEATURED_SKINS.map((id) => {
            const item = skinById(id);
            return (
              <button
                key={id}
                type="button"
                className={`coil-skin-dot ${skin === id ? 'is-on' : ''}`}
                style={{ background: `linear-gradient(135deg, ${item.color}, ${item.accent})` }}
                onClick={() => {
                  coilAudio.play('click');
                  onSkin(id);
                }}
                aria-label={item.name}
              />
            );
          })}
        </div>
        <p className="coil-empty">{equipped.name} equipped · {username || 'Rider'}</p>

        <label className="coil-label">Mode</label>
        <div className="coil-mode-row">
          {COIL_MODES.filter((item) => ['classic', 'time-rush', 'battle'].includes(item.id)).map((item) => (
            <button
              key={item.id}
              type="button"
              className={`coil-chip ${mode === item.id ? 'is-on' : ''}`}
              onClick={() => {
                coilAudio.play('click');
                onMode(item.id);
              }}
            >
              {item.name}
            </button>
          ))}
          <button type="button" className="coil-chip" onClick={() => onOpen('modes')}>
            More
          </button>
        </div>
      </div>

      <div className="coil-menu-grid">
        <button
          type="button"
          className="coil-cta"
          onClick={() => {
            coilAudio.play('click');
            onPlay();
          }}
        >
          Play now
        </button>
        <button type="button" className="coil-ghost" onClick={() => onOpen('howto')}>
          How to play
        </button>
        <button type="button" className="coil-ghost" onClick={() => onOpen('leaderboard')}>
          Leaderboard
        </button>
        <button type="button" className="coil-ghost" onClick={() => onOpen('rooms')}>
          Play with friends
        </button>
      </div>
      <button type="button" className="coil-daily" onClick={onDaily}>
        <span>Daily surge</span>
        <b>{dailyReady ? 'Claim login reward' : 'Already claimed today'}</b>
      </button>
    </div>
  );
}
