import { AppError } from '../../utils/AppError';

export const SOLO_SESSION_GAMES = new Set(['block-master', 'chess', 'puzzle-world', 'jigsaw-world', 'bottle-shooter-3d']);
export const SCORE_LEADERBOARD_GAMES = new Set(['block-master', 'puzzle-world', 'jigsaw-world', 'bottle-shooter-3d']);

export interface SoloResultInput {
  score?: unknown;
  lines?: unknown;
  level?: unknown;
  durationMs?: unknown;
  result?: unknown;
  reason?: unknown;
  moves?: unknown;
  captures?: unknown;
  foodEaten?: unknown;
  kills?: unknown;
  length?: unknown;
  mode?: unknown;
}

export interface ValidatedSoloResult {
  score: number;
  lines: number;
  level: number;
  durationMs: number;
  result: 'win' | 'loss' | 'draw' | 'completed';
  reason: string;
  moves: number;
  captures: number;
  foodEaten: number;
  kills: number;
  length: number;
  mode?: string;
}

const MAX_SCORE = 10_000_000;
const MAX_DURATION_MS = 8 * 60 * 60 * 1000;

const asInt = (value: unknown, fallback = 0): number => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
};

const requireNonNegative = (label: string, value: number): number => {
  if (value < 0) throw new AppError(`Invalid ${label}`, 400);
  return value;
};

export const isSoloSessionAllowed = (gameType: string, settings: Record<string, unknown> = {}): boolean => {
  if (
    gameType === 'block-master' ||
    gameType === 'puzzle-world' ||
    gameType === 'jigsaw-world' ||
    gameType === 'bottle-shooter-3d'
  ) {
    return true;
  }
  if (gameType === 'chess') {
    const mode = String(settings.mode || '');
    return mode === 'computer' || mode === 'local';
  }
  return false;
};

export const validateSoloResult = (gameType: string, input: SoloResultInput): ValidatedSoloResult => {
  const durationMs = requireNonNegative('duration', asInt(input.durationMs, 0));
  if (durationMs > MAX_DURATION_MS) throw new AppError('Invalid duration', 400);

  const score = requireNonNegative('score', asInt(input.score, 0));
  if (score > MAX_SCORE) throw new AppError('Invalid score', 400);

  const lines = requireNonNegative('lines', asInt(input.lines, 0));
  const level = Math.max(1, asInt(input.level, 1));
  const moves = requireNonNegative('moves', asInt(input.moves, 0));
  const captures = requireNonNegative('captures', asInt(input.captures, 0));
  const foodEaten = requireNonNegative('foodEaten', asInt(input.foodEaten, 0));
  const kills = requireNonNegative('kills', asInt(input.kills, 0));
  const length = requireNonNegative('length', asInt(input.length, 0));
  const mode = input.mode != null ? String(input.mode) : undefined;
  const reason = input.reason != null ? String(input.reason).slice(0, 40) : 'completed';

  if (gameType === 'block-master') {
    if (level > Math.floor(lines / 10) + 3) {
      throw new AppError('Score payload failed validation', 400);
    }
    const maxPlausible = lines * 800 * Math.max(level, 1) * 2 + 800;
    if (score > maxPlausible) {
      throw new AppError('Score payload failed validation', 400);
    }
    if (score > 800 && durationMs < 1500) {
      throw new AppError('Score payload failed validation', 400);
    }
    return {
      score,
      lines,
      level,
      durationMs,
      result: 'completed',
      reason,
      moves,
      captures,
      foodEaten,
      kills,
      length,
      mode,
    };
  }

  if (gameType === 'jigsaw-world') {
    const piecesForLevel: Record<number, number> = { 1: 12, 2: 24, 3: 40, 4: 60 };
    const expectedPieces = piecesForLevel[level];
    if (!expectedPieces || lines !== expectedPieces) {
      throw new AppError('Score payload failed validation', 400);
    }
    const maxPlausible = level * 400 + expectedPieces * 8 * 4 + 200;
    if (score > maxPlausible) {
      throw new AppError('Score payload failed validation', 400);
    }
    if (score > 200 && durationMs < 2000) {
      throw new AppError('Score payload failed validation', 400);
    }
    if (lines >= 24 && durationMs < 5000) {
      throw new AppError('Score payload failed validation', 400);
    }
    if (lines >= 40 && durationMs < 10000) {
      throw new AppError('Score payload failed validation', 400);
    }
    if (lines >= 60 && durationMs < 16000) {
      throw new AppError('Score payload failed validation', 400);
    }
    return {
      score,
      lines,
      level,
      durationMs,
      result: 'completed',
      reason,
      moves,
      captures,
      foodEaten,
      kills,
      length,
      mode,
    };
  }

  if (gameType === 'puzzle-world') {
    if (lines > 12 || level > 12) {
      throw new AppError('Score payload failed validation', 400);
    }
    if (score > lines * 800 + 1200) {
      throw new AppError('Score payload failed validation', 400);
    }
    if (score > 250 && durationMs < 400) {
      throw new AppError('Score payload failed validation', 400);
    }
    if (lines >= 6 && durationMs < 2500) {
      throw new AppError('Score payload failed validation', 400);
    }
    return {
      score,
      lines,
      level,
      durationMs,
      result: 'completed',
      reason,
      moves,
      captures,
      foodEaten,
      kills,
      length,
      mode,
    };
  }

  if (gameType === 'bottle-shooter-3d') {
    if (level > 8 || lines > 120) {
      throw new AppError('Score payload failed validation', 400);
    }
    if (score > lines * 5500 + 2000) {
      throw new AppError('Score payload failed validation', 400);
    }
    if (score > 200 && durationMs < 800) {
      throw new AppError('Score payload failed validation', 400);
    }
    if (lines >= 8 && durationMs < 4000) {
      throw new AppError('Score payload failed validation', 400);
    }
    return {
      score,
      lines,
      level,
      durationMs,
      result: 'completed',
      reason,
      moves,
      captures,
      foodEaten,
      kills,
      length,
      mode,
    };
  }

  if (gameType === 'chess') {
    const allowed = new Set(['win', 'loss', 'draw']);
    const result = allowed.has(String(input.result)) ? (input.result as 'win' | 'loss' | 'draw') : null;
    if (!result) throw new AppError('Invalid chess result', 400);
    if (reason === 'checkmate' && moves < 2) {
      throw new AppError('Score payload failed validation', 400);
    }
    if (result === 'win' && reason === 'checkmate' && durationMs < 800) {
      throw new AppError('Score payload failed validation', 400);
    }
    return {
      score,
      lines,
      level,
      durationMs,
      result,
      reason,
      moves,
      captures,
      foodEaten,
      kills,
      length,
      mode,
    };
  }

  if (gameType === 'snake-multiplayer' || gameType === 'coil-rush') {
    if (score > 0 && durationMs < 400) {
      throw new AppError('Score payload failed validation', 400);
    }
    return {
      score,
      lines,
      level,
      durationMs,
      result: 'completed',
      reason,
      moves,
      captures,
      foodEaten,
      kills,
      length,
      mode,
    };
  }

  throw new AppError('Unsupported game result', 400);
};

export const botEloForDifficulty = (difficulty: unknown): number => {
  switch (String(difficulty)) {
    case 'beginner':
      return 800;
    case 'easy':
      return 1000;
    case 'hard':
      return 1400;
    case 'expert':
      return 1600;
    default:
      return 1200;
  }
};

export const soloCoinsForScore = (score: number): number => {
  if (score >= 5000) return 50;
  if (score >= 1000) return 20;
  if (score >= 1) return 10;
  return 5;
};
