type CarromSoundName = 'strike' | 'collision' | 'wall' | 'pocket' | 'queen' | 'turn' | 'foul' | 'win';

let context: AudioContext | null = null;
let muted = false;

const ctx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!context) {
    const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    context = new AudioCtor();
  }
  return context;
};

export const setCarromMuted = (value: boolean): void => {
  muted = value;
};

export const isCarromMuted = (): boolean => muted;

const tone = (freq: number, duration: number, type: OscillatorType, gain = 0.08): void => {
  const audio = ctx();
  if (!audio || muted) return;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain, audio.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
};

export const playCarromSound = (name: CarromSoundName): void => {
  if (muted) return;
  void ctx()?.resume();
  switch (name) {
    case 'strike':
      tone(180, 0.12, 'square', 0.07);
      tone(90, 0.16, 'sine', 0.05);
      break;
    case 'collision':
      tone(240 + Math.random() * 40, 0.07, 'triangle', 0.045);
      break;
    case 'wall':
      tone(140, 0.08, 'sine', 0.04);
      break;
    case 'pocket':
      tone(420, 0.16, 'sine', 0.06);
      tone(620, 0.2, 'triangle', 0.04);
      break;
    case 'queen':
      tone(520, 0.22, 'sine', 0.07);
      tone(780, 0.28, 'triangle', 0.05);
      break;
    case 'turn':
      tone(360, 0.1, 'sine', 0.04);
      break;
    case 'foul':
      tone(160, 0.2, 'sawtooth', 0.04);
      break;
    case 'win':
      tone(520, 0.18, 'sine', 0.06);
      tone(660, 0.24, 'triangle', 0.05);
      break;
    default:
      break;
  }
};
