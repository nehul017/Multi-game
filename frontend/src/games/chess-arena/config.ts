import type {
  ChessBoardTheme,
  ChessDifficulty,
  ChessModeInfo,
  ChessSettings,
  ChessTimeControl,
} from './types';

export const CHESS_STORAGE = {
  settings: 'multigame-chess-settings',
} as const;

export const CHESS_MODES: ChessModeInfo[] = [
  { id: 'quick', name: 'Quick Match', blurb: 'Jump in. 1, 3, 5, or 10 minute clocks.' },
  { id: 'ranked', name: 'Ranked', blurb: 'Rating-based pairing. Every game counts.' },
  { id: 'casual', name: 'Casual', blurb: 'Same board, no rating swing.' },
  { id: 'computer', name: 'vs Computer', blurb: 'Five strengths. Practice without a queue.' },
  { id: 'local', name: 'Local', blurb: 'Two players. One device. Pass the board.' },
  { id: 'private', name: 'Private Game', blurb: 'Create a room or join with a code.' },
];

export const CHESS_TIMES: ChessTimeControl[] = [
  { id: '1', label: '1 min', seconds: 60 },
  { id: '3', label: '3 min', seconds: 180 },
  { id: '5', label: '5 min', seconds: 300 },
  { id: '10', label: '10 min', seconds: 600 },
];

export const CHESS_DIFFICULTIES: Array<{ id: ChessDifficulty; name: string; blurb: string }> = [
  { id: 'beginner', name: 'Beginner', blurb: 'Learns the pieces. Leaves openings.' },
  { id: 'easy', name: 'Easy', blurb: 'Plays legal chess with light pressure.' },
  { id: 'medium', name: 'Medium', blurb: 'Looks a few moves ahead.' },
  { id: 'hard', name: 'Hard', blurb: 'Fights for material and king safety.' },
  { id: 'expert', name: 'Expert', blurb: 'Deep search. Punishes loose pieces.' },
];

export const DEFAULT_CHESS_SETTINGS: ChessSettings = {
  boardTheme: 'default',
  pieceStyle: 'royal',
  animationSpeed: 'normal',
  masterVolume: 0.7,
  effectsVolume: 0.8,
  musicVolume: 0.25,
  muted: false,
  moveSound: true,
  captureSound: true,
  coordinates: true,
  legalHints: true,
  lastMoveHighlight: true,
  showCaptured: true,
  orientation: 'auto',
};

export const ANIM_MS: Record<ChessSettings['animationSpeed'], number> = {
  off: 0,
  fast: 180,
  normal: 320,
  slow: 520,
};

export const BOARD_THEMES: Record<
  ChessBoardTheme,
  {
    label: string;
    light: string;
    dark: string;
    selected: string;
    last: string;
    check: string;
    mate: string;
    hint: string;
    capture: string;
    rim: string;
    coord: string;
    shadow: string;
  }
> = {
  default: {
    label: 'Default',
    light: 'repeating-linear-gradient(92deg, rgba(120,85,45,0.07) 0 1px, transparent 1px 5px), linear-gradient(155deg, #F0D9B5 0%, #E8C992 48%, #DDB87A 100%)',
    dark: 'repeating-linear-gradient(88deg, rgba(40,22,10,0.14) 0 1px, transparent 1px 6px), linear-gradient(155deg, #B58863 0%, #8B5A3C 45%, #6B3F24 100%)',
    selected: 'rgba(124, 58, 237, 0.34)',
    last: 'rgba(167, 139, 250, 0.32)',
    check: 'rgba(239, 68, 68, 0.42)',
    mate: 'rgba(220, 38, 38, 0.5)',
    hint: 'rgba(124, 58, 237, 0.88)',
    capture: 'rgba(239, 68, 68, 0.82)',
    rim: 'linear-gradient(160deg, #A06B3C 0%, #7A4A28 35%, #5C3418 70%, #3E220F 100%)',
    coord: 'rgba(245,230,200,0.74)',
    shadow: 'rgba(0,0,0,0.45)',
  },
  dark: {
    label: 'Dark',
    light: 'linear-gradient(155deg, #3a4258 0%, #2f3648 100%)',
    dark: 'linear-gradient(155deg, #1b2130 0%, #121827 100%)',
    selected: 'rgba(139, 92, 246, 0.4)',
    last: 'rgba(139, 92, 246, 0.28)',
    check: 'rgba(239, 68, 68, 0.48)',
    mate: 'rgba(220, 38, 38, 0.55)',
    hint: 'rgba(167, 139, 250, 0.95)',
    capture: 'rgba(248, 113, 113, 0.9)',
    rim: 'linear-gradient(160deg, #2a3144 0%, #121827 60%, #0b0f18 100%)',
    coord: 'rgba(165, 173, 203, 0.8)',
    shadow: 'rgba(0,0,0,0.55)',
  },
  neon: {
    label: 'Neon',
    light: 'linear-gradient(155deg, #2a1f4a 0%, #3b2a6b 100%)',
    dark: 'linear-gradient(155deg, #12081f 0%, #1a0d33 100%)',
    selected: 'rgba(167, 139, 250, 0.5)',
    last: 'rgba(139, 92, 246, 0.38)',
    check: 'rgba(244, 63, 94, 0.5)',
    mate: 'rgba(225, 29, 72, 0.58)',
    hint: 'rgba(196, 181, 253, 1)',
    capture: 'rgba(251, 113, 133, 0.95)',
    rim: 'linear-gradient(160deg, #6d28d9 0%, #4c1d95 50%, #1e1033 100%)',
    coord: 'rgba(221, 214, 254, 0.82)',
    shadow: 'rgba(109, 40, 217, 0.45)',
  },
  classic: {
    label: 'Classic',
    light: 'linear-gradient(155deg, #e8dcc4 0%, #d9c9a8 100%)',
    dark: 'linear-gradient(155deg, #6d8b63 0%, #4f6b48 100%)',
    selected: 'rgba(109, 40, 217, 0.28)',
    last: 'rgba(245, 158, 11, 0.28)',
    check: 'rgba(220, 38, 38, 0.4)',
    mate: 'rgba(185, 28, 28, 0.5)',
    hint: 'rgba(109, 40, 217, 0.8)',
    capture: 'rgba(220, 38, 38, 0.78)',
    rim: 'linear-gradient(160deg, #8b6b3d 0%, #5c4324 70%, #3a2a16 100%)',
    coord: 'rgba(255, 247, 230, 0.78)',
    shadow: 'rgba(0,0,0,0.4)',
  },
  premium: {
    label: 'Premium',
    light: 'linear-gradient(155deg, #f3e6c8 0%, #e4c98a 55%, #d4af55 100%)',
    dark: 'linear-gradient(155deg, #4c1d95 0%, #3b0764 50%, #1e1033 100%)',
    selected: 'rgba(212, 175, 55, 0.42)',
    last: 'rgba(167, 139, 250, 0.34)',
    check: 'rgba(239, 68, 68, 0.46)',
    mate: 'rgba(220, 38, 38, 0.55)',
    hint: 'rgba(251, 191, 36, 0.95)',
    capture: 'rgba(244, 63, 94, 0.88)',
    rim: 'linear-gradient(160deg, #d4af55 0%, #7c3aed 45%, #2e1065 100%)',
    coord: 'rgba(255, 247, 220, 0.82)',
    shadow: 'rgba(76, 29, 149, 0.5)',
  },
};

export const PIECE_VALUES: Record<string, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};
