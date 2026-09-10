import { COIL_STORAGE } from '../config';

export type CoilCue =
  | 'food'
  | 'boost'
  | 'death'
  | 'level'
  | 'click'
  | 'achieve'
  | 'powerup'
  | 'eliminate'
  | 'countdown'
  | 'roundStart'
  | 'roundEnd';

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

  stop() {
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.suspend();
    }
  }

  play(cue: CoilCue) {
    if (this.muted || typeof window === 'undefined') return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const tones: Record<CoilCue, { freq: number; dur: number; type: OscillatorType }> = {
      food: { freq: 680, dur: 0.07, type: 'triangle' },
      boost: { freq: 210, dur: 0.1, type: 'sawtooth' },
      death: { freq: 96, dur: 0.32, type: 'square' },
      level: { freq: 520, dur: 0.2, type: 'triangle' },
      click: { freq: 440, dur: 0.05, type: 'sine' },
      achieve: { freq: 740, dur: 0.18, type: 'triangle' },
      powerup: { freq: 880, dur: 0.16, type: 'triangle' },
      eliminate: { freq: 320, dur: 0.2, type: 'sawtooth' },
      countdown: { freq: 500, dur: 0.12, type: 'sine' },
      roundStart: { freq: 620, dur: 0.22, type: 'triangle' },
      roundEnd: { freq: 180, dur: 0.28, type: 'sine' },
    };
    const tone = tones[cue];
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.freq, now);
    gain.gain.setValueAtTime(0.035, now);
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
