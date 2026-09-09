export type JigsawCue = 'pickup' | 'drop' | 'snap' | 'complete';

let context: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!context) context = new AudioCtx();
  return context;
}

function tone(frequency: number, duration: number, type: OscillatorType, gain = 0.06, slide?: number) {
  const audio = ctx();
  if (!audio) return;
  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const amp = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (slide) oscillator.frequency.exponentialRampToValueAtTime(slide, now + duration);
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(amp).connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

export function playJigsawCue(cue: JigsawCue) {
  const audio = ctx();
  if (!audio) return;
  if (audio.state === 'suspended') void audio.resume();

  if (cue === 'pickup') {
    tone(340, 0.06, 'triangle', 0.04);
    return;
  }
  if (cue === 'drop') {
    tone(220, 0.07, 'sine', 0.035);
    return;
  }
  if (cue === 'snap') {
    tone(540, 0.08, 'triangle', 0.07, 720);
    return;
  }
  tone(523, 0.12, 'sine', 0.06);
  window.setTimeout(() => tone(659, 0.14, 'sine', 0.055), 90);
  window.setTimeout(() => tone(784, 0.22, 'triangle', 0.05), 180);
}
