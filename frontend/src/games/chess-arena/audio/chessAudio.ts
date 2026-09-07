import { chessSettings } from '../storage/settings';

export type ChessCue =
  | 'move'
  | 'capture'
  | 'check'
  | 'checkmate'
  | 'castle'
  | 'promotion'
  | 'illegal'
  | 'click'
  | 'timer'
  | 'start'
  | 'end'
  | 'victory'
  | 'defeat'
  | 'draw'
  | 'notify';

class ChessAudioService {
  private ctx: AudioContext | null = null;
  private unlocked = false;

  unlock() {
    if (this.unlocked) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    this.unlocked = true;
  }

  play(cue: ChessCue) {
    if (typeof window === 'undefined') return;
    const settings = chessSettings.get();
    if (settings.muted) return;
    if (cue === 'move' && !settings.moveSound) return;
    if (cue === 'capture' && !settings.captureSound) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const vol = settings.masterVolume * settings.effectsVolume;

    switch (cue) {
      case 'move':
        this.woodTap(ctx, now, 0.045 * vol, 190, 0.07);
        break;
      case 'capture':
        this.woodTap(ctx, now, 0.07 * vol, 140, 0.11);
        this.tone(ctx, now, 90, 0.09, 'triangle', 0.03 * vol);
        break;
      case 'check':
        this.tone(ctx, now, 420, 0.12, 'sine', 0.035 * vol);
        this.tone(ctx, now + 0.06, 560, 0.1, 'triangle', 0.028 * vol);
        break;
      case 'checkmate':
        this.tone(ctx, now, 220, 0.22, 'sine', 0.05 * vol);
        this.tone(ctx, now + 0.12, 330, 0.2, 'triangle', 0.04 * vol);
        this.tone(ctx, now + 0.26, 494, 0.28, 'sine', 0.045 * vol);
        break;
      case 'castle':
        this.woodTap(ctx, now, 0.04 * vol, 180, 0.06);
        this.woodTap(ctx, now + 0.08, 0.04 * vol, 200, 0.06);
        break;
      case 'promotion':
        this.tone(ctx, now, 523, 0.12, 'triangle', 0.04 * vol);
        this.tone(ctx, now + 0.1, 659, 0.14, 'sine', 0.035 * vol);
        break;
      case 'illegal':
        this.tone(ctx, now, 110, 0.08, 'square', 0.02 * vol);
        break;
      case 'click':
        this.tone(ctx, now, 440, 0.04, 'sine', 0.02 * vol);
        break;
      case 'timer':
        this.tone(ctx, now, 880, 0.04, 'sine', 0.018 * vol);
        break;
      case 'start':
        this.tone(ctx, now, 392, 0.1, 'triangle', 0.035 * vol);
        this.tone(ctx, now + 0.12, 523, 0.14, 'sine', 0.04 * vol);
        break;
      case 'end':
        this.tone(ctx, now, 247, 0.18, 'sine', 0.03 * vol);
        break;
      case 'victory':
        this.tone(ctx, now, 523, 0.12, 'triangle', 0.04 * vol);
        this.tone(ctx, now + 0.1, 659, 0.14, 'sine', 0.04 * vol);
        this.tone(ctx, now + 0.22, 784, 0.2, 'sine', 0.045 * vol);
        break;
      case 'defeat':
        this.tone(ctx, now, 196, 0.22, 'sine', 0.035 * vol);
        this.tone(ctx, now + 0.14, 147, 0.26, 'triangle', 0.03 * vol);
        break;
      case 'draw':
        this.tone(ctx, now, 330, 0.14, 'sine', 0.03 * vol);
        this.tone(ctx, now + 0.12, 330, 0.16, 'triangle', 0.025 * vol);
        break;
      case 'notify':
        this.tone(ctx, now, 620, 0.08, 'sine', 0.025 * vol);
        break;
      default:
        break;
    }
  }

  private woodTap(ctx: AudioContext, at: number, gain: number, freq: number, dur: number) {
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, at);
    amp.gain.exponentialRampToValueAtTime(0.001, at + dur);
    noise.connect(filter);
    filter.connect(amp);
    amp.connect(ctx.destination);
    noise.start(at);
    noise.stop(at + dur);
    this.tone(ctx, at, freq, dur * 0.8, 'sine', gain * 0.7);
  }

  private tone(
    ctx: AudioContext,
    at: number,
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number
  ) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    amp.gain.setValueAtTime(gain, at);
    amp.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur);
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

export const chessAudio = new ChessAudioService();
