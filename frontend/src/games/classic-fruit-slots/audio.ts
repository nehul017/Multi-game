const STORAGE_KEY = 'classic-fruit-slots-muted';

type Cue = 'spin' | 'stop' | 'win' | 'bigWin' | 'click' | 'error';

class FruitSlotsAudio {
  private ctx: AudioContext | null = null;
  private muted = false;

  constructor() {
    if (typeof window === 'undefined') return;
    this.muted = window.localStorage.getItem(STORAGE_KEY) === '1';
  }

  isMuted() {
    return this.muted;
  }

  setMuted(next: boolean) {
    this.muted = next;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    }
  }

  play(cue: Cue) {
    if (this.muted || typeof window === 'undefined') return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (cue === 'bigWin') {
      [523, 659, 784, 1046].forEach((freq, index) => {
        this.tone(ctx, now + index * 0.08, freq, 0.16, 'triangle', 0.05);
      });
      return;
    }

    const tones: Record<Exclude<Cue, 'bigWin'>, { freq: number; dur: number; type: OscillatorType; gain: number }> = {
      spin: { freq: 180, dur: 0.12, type: 'sawtooth', gain: 0.03 },
      stop: { freq: 320, dur: 0.08, type: 'square', gain: 0.03 },
      win: { freq: 660, dur: 0.22, type: 'triangle', gain: 0.045 },
      click: { freq: 440, dur: 0.05, type: 'sine', gain: 0.03 },
      error: { freq: 140, dur: 0.18, type: 'square', gain: 0.035 },
    };
    const tone = tones[cue];
    this.tone(ctx, now, tone.freq, tone.dur, tone.type, tone.gain);
  }

  private tone(
    ctx: AudioContext,
    start: number,
    freq: number,
    dur: number,
    type: OscillatorType,
    gainValue: number
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.start(start);
    osc.stop(start + dur);
  }

  private ensure() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    return this.ctx;
  }
}

export const fruitSlotsAudio = new FruitSlotsAudio();
