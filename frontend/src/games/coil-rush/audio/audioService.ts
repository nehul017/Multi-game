import { COIL_STORAGE } from '../config';

type Cue = 'food' | 'boost' | 'death' | 'level' | 'click' | 'achieve';

class CoilAudioService {
  private ctx: AudioContext | null = null;
  private muted = false;
  private musicOn = true;

  constructor() {
    if (typeof window === 'undefined') return;
    this.muted = window.localStorage.getItem(COIL_STORAGE.muted) === '1';
    this.musicOn = window.localStorage.getItem(COIL_STORAGE.music) !== '0';
  }

  isMuted() {
    return this.muted;
  }

  isMusicOn() {
    return this.musicOn && !this.muted;
  }

  setMuted(next: boolean) {
    this.muted = next;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COIL_STORAGE.muted, next ? '1' : '0');
    }
  }

  setMusic(next: boolean) {
    this.musicOn = next;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COIL_STORAGE.music, next ? '1' : '0');
    }
  }

  play(cue: Cue) {
    if (this.muted || typeof window === 'undefined') return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const tones: Record<Cue, { freq: number; dur: number; type: OscillatorType }> = {
      food: { freq: 660, dur: 0.07, type: 'triangle' },
      boost: { freq: 220, dur: 0.12, type: 'sawtooth' },
      death: { freq: 110, dur: 0.28, type: 'square' },
      level: { freq: 520, dur: 0.2, type: 'triangle' },
      click: { freq: 440, dur: 0.05, type: 'sine' },
      achieve: { freq: 740, dur: 0.18, type: 'triangle' },
    };
    const tone = tones[cue];
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.freq, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + tone.dur);
    osc.start(now);
    osc.stop(now + tone.dur);
  }

  private ensure() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    return this.ctx;
  }
}

export const coilAudio = new CoilAudioService();
