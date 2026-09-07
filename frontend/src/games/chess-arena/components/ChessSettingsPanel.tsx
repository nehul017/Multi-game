'use client';

import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { BOARD_THEMES } from '../config';
import type { ChessAnimSpeed, ChessBoardTheme, ChessOrientationMode, ChessPieceStyle, ChessSettings } from '../types';

interface ChessSettingsPanelProps {
  open: boolean;
  settings: ChessSettings;
  onChange: (next: Partial<ChessSettings>) => void;
  onClose: () => void;
}

const SPEEDS: ChessAnimSpeed[] = ['off', 'fast', 'normal', 'slow'];
const ORIENT: ChessOrientationMode[] = ['auto', 'white', 'black'];
const STYLES: ChessPieceStyle[] = ['royal', 'classic'];

export function ChessSettingsPanel({ open, settings, onChange, onClose }: ChessSettingsPanelProps) {
  return (
    <Modal isOpen={open} onClose={onClose} title="Board settings" size="md">
      <div className="space-y-5">
        <section>
          <p className="cx-label">Board theme</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(BOARD_THEMES) as ChessBoardTheme[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ boardTheme: id })}
                className={`cx-theme-swatch ${settings.boardTheme === id ? 'is-on' : ''}`}
              >
                <span style={{ backgroundImage: BOARD_THEMES[id].light }} />
                <span style={{ backgroundImage: BOARD_THEMES[id].dark }} />
                {BOARD_THEMES[id].label}
              </button>
            ))}
          </div>
        </section>
        <section>
          <p className="cx-label">Piece style</p>
          <div className="flex gap-2">
            {STYLES.map((id) => (
              <button key={id} type="button" className={`cx-chip-btn ${settings.pieceStyle === id ? 'is-on' : ''}`} onClick={() => onChange({ pieceStyle: id })}>
                {id === 'royal' ? 'Royal' : 'Classic'}
              </button>
            ))}
          </div>
        </section>
        <section>
          <p className="cx-label">Animation</p>
          <div className="flex flex-wrap gap-2">
            {SPEEDS.map((id) => (
              <button key={id} type="button" className={`cx-chip-btn ${settings.animationSpeed === id ? 'is-on' : ''}`} onClick={() => onChange({ animationSpeed: id })}>
                {id}
              </button>
            ))}
          </div>
        </section>
        <section>
          <p className="cx-label">Orientation</p>
          <div className="flex flex-wrap gap-2">
            {ORIENT.map((id) => (
              <button key={id} type="button" className={`cx-chip-btn ${settings.orientation === id ? 'is-on' : ''}`} onClick={() => onChange({ orientation: id })}>
                {id}
              </button>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <label className="cx-slider">
            <span>Master volume</span>
            <input type="range" min={0} max={1} step={0.05} value={settings.masterVolume} onChange={(e) => onChange({ masterVolume: Number(e.target.value) })} />
          </label>
          <label className="cx-slider">
            <span>Effects</span>
            <input type="range" min={0} max={1} step={0.05} value={settings.effectsVolume} onChange={(e) => onChange({ effectsVolume: Number(e.target.value) })} />
          </label>
          <label className="cx-slider">
            <span>Music</span>
            <input type="range" min={0} max={1} step={0.05} value={settings.musicVolume} onChange={(e) => onChange({ musicVolume: Number(e.target.value) })} />
          </label>
        </section>
        <div className="space-y-3">
          <Switch checked={!settings.muted} onChange={(v) => onChange({ muted: !v })} label="Sound" />
          <Switch checked={settings.moveSound} onChange={(v) => onChange({ moveSound: v })} label="Move sound" />
          <Switch checked={settings.captureSound} onChange={(v) => onChange({ captureSound: v })} label="Capture sound" />
          <Switch checked={settings.coordinates} onChange={(v) => onChange({ coordinates: v })} label="Coordinates" />
          <Switch checked={settings.legalHints} onChange={(v) => onChange({ legalHints: v })} label="Legal move hints" />
          <Switch checked={settings.lastMoveHighlight} onChange={(v) => onChange({ lastMoveHighlight: v })} label="Last move highlight" />
          <Switch checked={settings.showCaptured} onChange={(v) => onChange({ showCaptured: v })} label="Show captured pieces" />
        </div>
      </div>
    </Modal>
  );
}
