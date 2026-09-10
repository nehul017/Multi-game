import { bottleShooterStorage } from './storage';
import type { AudioSettings } from './types';

export type ShooterCue =
  | 'shot'
  | 'reload'
  | 'magazine-click'
  | 'handling'
  | 'empty'
  | 'glass-hit'
  | 'glass-crack'
  | 'shatter'
  | 'metal'
  | 'wood'
  | 'combo'
  | 'bonus'
  | 'gold'
  | 'level-complete'
  | 'level-failed'
  | 'countdown'
  | 'go'
  | 'click'
  | 'button'
  | 'perfect';

class BottleShooterAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private music: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private settings: AudioSettings = { muted: false, soundVolume: 0.85, musicVolume: 0.35 };
  private musicNodes: OscillatorNode[] = [];
  private ambienceNodes: AudioBufferSourceNode[] = [];
  private musicPlaying = false;
  private unlocked = false;
  private birdTimer: number | null = null;
  private cricketTimer: number | null = null;
  private distantTimer: number | null = null;
  private lastPan = 0;
  private panner: StereoPannerNode | null = null;

  constructor() {
    this.settings = bottleShooterStorage.getAudio();
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  unlock(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    this.unlocked = true;
    this.applyVolumes();
    this.startBeds();
  }

  setMuted(muted: boolean): void {
    this.settings.muted = muted;
    bottleShooterStorage.setAudio(this.settings);
    this.applyVolumes();
    if (muted) this.stopBeds();
    else if (this.unlocked) this.startBeds();
  }

  setSoundVolume(volume: number): void {
    this.settings.soundVolume = Math.min(1, Math.max(0, volume));
    bottleShooterStorage.setAudio(this.settings);
    this.applyVolumes();
  }

  setMusicVolume(volume: number): void {
    this.settings.musicVolume = Math.min(1, Math.max(0, volume));
    bottleShooterStorage.setAudio(this.settings);
    this.applyVolumes();
  }

  stop(): void {
    this.stopBeds();
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.suspend();
  }

  play(cue: ShooterCue, extra?: { combo?: number; pan?: number }): void {
    if (this.settings.muted || typeof window === 'undefined') return;
    const ctx = this.ensure();
    if (!ctx || !this.sfx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    if (typeof extra?.pan === 'number') this.lastPan = extra.pan;

    switch (cue) {
      case 'shot':
        this.gunshot(ctx, now);
        return;
      case 'reload':
        this.reloadSound(ctx, now);
        return;
      case 'magazine-click':
        this.metalClick(ctx, now, 1900, 0.045, 0.05);
        return;
      case 'handling':
        this.metalClick(ctx, now, 420, 0.06, 0.03);
        this.metalClick(ctx, now + 0.08, 680, 0.04, 0.02);
        return;
      case 'empty':
        this.metalClick(ctx, now, 160, 0.07, 0.04);
        this.metalClick(ctx, now + 0.04, 280, 0.04, 0.03);
        return;
      case 'glass-hit':
        this.withPan(() => {
          this.glass(ctx, now, 0.12, 2400);
          this.glass(ctx, now + 0.02, 0.08, 3600);
        });
        return;
      case 'glass-crack':
        this.withPan(() => {
          this.glass(ctx, now, 0.2, 1800);
          this.glass(ctx, now + 0.04, 0.12, 2800);
          this.noiseBurst(ctx, now, 0.08, 0.04, 900, 3200);
          this.noiseBurst(ctx, now + 0.03, 0.06, 0.03, 1400, 5000);
        });
        return;
      case 'shatter':
        this.withPan(() => this.shatter(ctx, now));
        return;
      case 'metal':
        this.withPan(() => this.metalImpact(ctx, now));
        return;
      case 'wood':
        this.withPan(() => this.woodImpact(ctx, now));
        return;
      case 'combo':
        this.comboSound(ctx, now, extra?.combo ?? 2);
        return;
      case 'bonus':
        this.bonusSound(ctx, now);
        return;
      case 'gold':
        this.goldSound(ctx, now);
        return;
      case 'perfect':
        this.perfectSound(ctx, now);
        return;
      case 'level-complete':
        this.levelCompleteSound(ctx, now);
        return;
      case 'level-failed':
        this.levelFailedSound(ctx, now);
        return;
      case 'countdown':
        this.tone(ctx, now, 520, 0.12, 'sine', 0.05);
        this.tone(ctx, now + 0.03, 522, 0.1, 'sine', 0.02);
        return;
      case 'go':
        this.tone(ctx, now, 620, 0.1, 'triangle', 0.055);
        this.tone(ctx, now + 0.07, 830, 0.18, 'triangle', 0.055);
        this.tone(ctx, now + 0.15, 1040, 0.12, 'sine', 0.03);
        return;
      case 'click':
      case 'button':
        this.metalClick(ctx, now, 540, 0.04, 0.025);
        return;
      default:
        return;
    }
  }

  private gunshot(ctx: AudioContext, now: number): void {
    this.noiseBurst(ctx, now, 0.14, 0.24, 60, 3200);
    this.noiseBurst(ctx, now + 0.005, 0.06, 0.1, 200, 6000);
    this.tone(ctx, now, 85, 0.16, 'sine', 0.18);
    this.tone(ctx, now, 170, 0.08, 'sawtooth', 0.06);
    this.tone(ctx, now + 0.015, 1500, 0.03, 'square', 0.035);
    this.noiseBurst(ctx, now + 0.04, 0.08, 0.04, 3000, 8000);
    if (this.reverb && this.reverbGain) {
      this.noiseBurstTo(ctx, now + 0.02, 0.3, 0.06, 100, 1200, this.reverbGain);
    }
  }

  private reloadSound(ctx: AudioContext, now: number): void {
    this.metalClick(ctx, now, 280, 0.08, 0.04);
    this.noiseBurst(ctx, now + 0.06, 0.04, 0.02, 200, 800);
    this.metalClick(ctx, now + 0.2, 210, 0.1, 0.045);
    this.metalClick(ctx, now + 0.45, 1600, 0.05, 0.05);
    this.noiseBurst(ctx, now + 0.62, 0.03, 0.025, 400, 1600);
    this.metalClick(ctx, now + 0.75, 900, 0.06, 0.04);
    this.tone(ctx, now + 1.08, 340, 0.08, 'triangle', 0.035);
    this.metalClick(ctx, now + 1.2, 1200, 0.04, 0.03);
  }

  private shatter(ctx: AudioContext, now: number): void {
    this.noiseBurst(ctx, now, 0.24, 0.14, 500, 7500);
    this.noiseBurst(ctx, now + 0.02, 0.12, 0.08, 1000, 12000);
    this.glass(ctx, now, 0.18, 3200);
    this.glass(ctx, now + 0.03, 0.14, 4400);
    this.glass(ctx, now + 0.07, 0.12, 2600);
    this.glass(ctx, now + 0.12, 0.08, 5200);
    this.tone(ctx, now, 130, 0.1, 'sine', 0.035);
    this.noiseBurst(ctx, now + 0.15, 0.18, 0.04, 2000, 9000);
  }

  private metalImpact(ctx: AudioContext, now: number): void {
    this.tone(ctx, now, 620, 0.08, 'square', 0.035);
    this.tone(ctx, now + 0.015, 1240, 0.05, 'triangle', 0.025);
    this.tone(ctx, now + 0.03, 880, 0.06, 'triangle', 0.02);
    this.noiseBurst(ctx, now, 0.04, 0.04, 1500, 6000);
  }

  private woodImpact(ctx: AudioContext, now: number): void {
    this.noiseBurst(ctx, now, 0.1, 0.05, 160, 600);
    this.noiseBurst(ctx, now + 0.02, 0.06, 0.03, 300, 1200);
    this.tone(ctx, now, 120, 0.06, 'sine', 0.03);
  }

  private comboSound(ctx: AudioContext, now: number, combo: number): void {
    const base = 440 + Math.min(5, combo) * 90;
    this.tone(ctx, now, base, 0.1, 'triangle', 0.05);
    this.tone(ctx, now + 0.06, base * 1.25, 0.13, 'triangle', 0.045);
    if (combo >= 4) {
      this.tone(ctx, now + 0.12, base * 1.5, 0.08, 'sine', 0.03);
    }
  }

  private bonusSound(ctx: AudioContext, now: number): void {
    [523, 659, 784, 988].forEach((freq, i) => {
      this.tone(ctx, now + i * 0.065, freq, 0.15, 'triangle', 0.045);
    });
    this.noiseBurst(ctx, now + 0.1, 0.2, 0.015, 4000, 10000);
  }

  private goldSound(ctx: AudioContext, now: number): void {
    [392, 523, 659, 784, 988, 1175].forEach((freq, i) => {
      this.tone(ctx, now + i * 0.055, freq, 0.18, 'triangle', 0.05);
      this.tone(ctx, now + i * 0.055 + 0.01, freq * 1.003, 0.15, 'sine', 0.02);
    });
  }

  private perfectSound(ctx: AudioContext, now: number): void {
    this.tone(ctx, now, 880, 0.08, 'sine', 0.04);
    this.tone(ctx, now + 0.06, 1320, 0.12, 'sine', 0.035);
  }

  private levelCompleteSound(ctx: AudioContext, now: number): void {
    [392, 494, 587, 784].forEach((freq, i) => {
      this.tone(ctx, now + i * 0.12, freq, 0.26, 'sine', 0.055);
      this.tone(ctx, now + i * 0.12 + 0.02, freq * 1.5, 0.18, 'triangle', 0.02);
    });
  }

  private levelFailedSound(ctx: AudioContext, now: number): void {
    this.tone(ctx, now, 220, 0.32, 'sawtooth', 0.045);
    this.tone(ctx, now + 0.06, 207, 0.3, 'sine', 0.04);
    this.tone(ctx, now + 0.14, 140, 0.4, 'sine', 0.05);
  }

  private glass(ctx: AudioContext, now: number, dur: number, freq: number): void {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + dur);
    filter.type = 'highpass';
    filter.frequency.value = 800;
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfx!);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  private metalClick(ctx: AudioContext, now: number, freq: number, dur: number, gainValue: number): void {
    this.tone(ctx, now, freq, dur, 'square', gainValue);
    this.noiseBurst(ctx, now, dur * 0.6, gainValue * 0.4, 400, 2800);
  }

  private tone(
    ctx: AudioContext,
    start: number,
    freq: number,
    dur: number,
    type: OscillatorType,
    gainValue: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(gain);
    gain.connect(this.sfx!);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  private noiseBurst(
    ctx: AudioContext,
    start: number,
    dur: number,
    gainValue: number,
    low: number,
    high: number
  ): void {
    this.noiseBurstTo(ctx, start, dur, gainValue, low, high, this.sfx!);
  }

  private noiseBurstTo(
    ctx: AudioContext,
    start: number,
    dur: number,
    gainValue: number,
    low: number,
    high: number,
    dest: AudioNode
  ): void {
    if (!this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = (low + high) / 2;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(start);
    src.stop(start + dur + 0.02);
  }

  private startBeds(): void {
    if (this.settings.muted || this.musicPlaying) return;
    const ctx = this.ensure();
    if (!ctx || !this.music || !this.noise) return;
    this.musicPlaying = true;

    const pad = (freq: number, type: OscillatorType, gainValue: number, detune = 0) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      gain.gain.value = gainValue;
      osc.connect(gain);
      gain.connect(this.music!);
      osc.start();
      this.musicNodes.push(osc);
    };
    pad(98, 'sine', 0.04);
    pad(98.3, 'sine', 0.015, 5);
    pad(146, 'sine', 0.025);
    pad(196, 'triangle', 0.012);
    pad(294, 'sine', 0.006);

    const wind = ctx.createBufferSource();
    wind.buffer = this.noise;
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 380;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.04;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.music);
    wind.start();
    this.ambienceNodes.push(wind);

    const breeze = ctx.createBufferSource();
    breeze.buffer = this.noise;
    breeze.loop = true;
    const breezeFilter = ctx.createBiquadFilter();
    breezeFilter.type = 'bandpass';
    breezeFilter.frequency.value = 220;
    breezeFilter.Q.value = 2.5;
    const breezeGain = ctx.createGain();
    breezeGain.gain.value = 0.012;
    breeze.connect(breezeFilter);
    breezeFilter.connect(breezeGain);
    breezeGain.connect(this.music);
    breeze.start();
    this.ambienceNodes.push(breeze);

    this.scheduleBird();
    this.scheduleCricket();
    this.scheduleDistantShot();
  }

  private withPan(fn: () => void): void {
    if (this.panner) this.panner.pan.value = this.lastPan;
    fn();
    if (this.panner) window.setTimeout(() => { if (this.panner) this.panner.pan.value = 0; }, 220);
  }

  private scheduleBird(): void {
    if (this.birdTimer != null) window.clearTimeout(this.birdTimer);
    if (this.settings.muted || !this.musicPlaying) return;
    this.birdTimer = window.setTimeout(() => {
      const ctx = this.ctx;
      if (ctx && this.music && !this.settings.muted) {
        const now = ctx.currentTime;
        const baseFreq = 1400 + Math.random() * 400;
        this.tone(ctx, now, baseFreq, 0.06, 'sine', 0.01);
        this.tone(ctx, now + 0.08, baseFreq * 1.18, 0.07, 'sine', 0.009);
        if (Math.random() > 0.5) {
          this.tone(ctx, now + 0.18, baseFreq * 0.95, 0.05, 'sine', 0.007);
        }
      }
      this.scheduleBird();
    }, 6000 + Math.random() * 10000);
  }

  private scheduleDistantShot(): void {
    if (this.distantTimer != null) window.clearTimeout(this.distantTimer);
    if (this.settings.muted || !this.musicPlaying) return;
    this.distantTimer = window.setTimeout(() => {
      const ctx = this.ctx;
      if (ctx && this.music && !this.settings.muted) {
        const now = ctx.currentTime;
        this.noiseBurstTo(ctx, now, 0.18, 0.018, 80, 900, this.music);
        this.tone(ctx, now, 70, 0.12, 'sine', 0.01);
      }
      this.scheduleDistantShot();
    }, 14000 + Math.random() * 18000);
  }

  private scheduleCricket(): void {
    if (this.cricketTimer != null) window.clearTimeout(this.cricketTimer);
    if (this.settings.muted || !this.musicPlaying) return;
    this.cricketTimer = window.setTimeout(() => {
      const ctx = this.ctx;
      if (ctx && this.music && !this.settings.muted) {
        const now = ctx.currentTime;
        for (let i = 0; i < 3; i++) {
          this.tone(ctx, now + i * 0.12, 4200 + Math.random() * 600, 0.03, 'sine', 0.004);
        }
      }
      this.scheduleCricket();
    }, 12000 + Math.random() * 18000);
  }

  private stopBeds(): void {
    this.musicPlaying = false;
    this.musicNodes.forEach((node) => {
      try { node.stop(); } catch { /* already stopped */ }
    });
    this.ambienceNodes.forEach((node) => {
      try { node.stop(); } catch { /* already stopped */ }
    });
    this.musicNodes = [];
    this.ambienceNodes = [];
    if (this.birdTimer != null) {
      window.clearTimeout(this.birdTimer);
      this.birdTimer = null;
    }
    if (this.cricketTimer != null) {
      window.clearTimeout(this.cricketTimer);
      this.cricketTimer = null;
    }
    if (this.distantTimer != null) {
      window.clearTimeout(this.distantTimer);
      this.distantTimer = null;
    }
  }

  private applyVolumes(): void {
    if (!this.master || !this.sfx || !this.music) return;
    const mute = this.settings.muted ? 0 : 1;
    this.master.gain.value = mute;
    this.sfx.gain.value = this.settings.soundVolume;
    this.music.gain.value = this.settings.musicVolume;
  }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.panner = this.ctx.createStereoPanner();

      this.reverb = this.ctx.createConvolver();
      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.value = 0.15;
      this.reverb.buffer = this.makeReverbIR(this.ctx, 1.8, 3200);
      this.reverbGain.connect(this.reverb);
      this.reverb.connect(this.sfx);

      this.sfx.connect(this.panner!);
      this.panner!.connect(this.master);
      this.music.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.noise = this.makeNoise(this.ctx);
      this.applyVolumes();
    }
    return this.ctx;
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private makeReverbIR(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
    const len = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * duration / decay));
      }
    }
    return buffer;
  }
}

export const shooterAudio = new BottleShooterAudio();
