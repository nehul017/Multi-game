import {
  botEloForDifficulty,
  isSoloSessionAllowed,
  soloCoinsForScore,
  validateSoloResult,
} from '../../games/core/result-validator';
import { AppError } from '../../utils/AppError';

describe('solo result validator', () => {
  it('allows block-master and chess computer/local sessions only', () => {
    expect(isSoloSessionAllowed('block-master')).toBe(true);
    expect(isSoloSessionAllowed('chess', { mode: 'computer' })).toBe(true);
    expect(isSoloSessionAllowed('chess', { mode: 'local' })).toBe(true);
    expect(isSoloSessionAllowed('chess', { mode: 'ranked' })).toBe(false);
    expect(isSoloSessionAllowed('tic-tac-toe')).toBe(false);
    expect(isSoloSessionAllowed('poker')).toBe(false);
  });

  it('accepts a plausible block-master score', () => {
    const result = validateSoloResult('block-master', {
      score: 1200,
      lines: 12,
      level: 2,
      durationMs: 40_000,
    });
    expect(result.result).toBe('completed');
    expect(result.score).toBe(1200);
  });

  it('rejects impossible block-master scores', () => {
    expect(() =>
      validateSoloResult('block-master', { score: 999999, lines: 1, level: 1, durationMs: 2000 })
    ).toThrow(AppError);
    expect(() =>
      validateSoloResult('block-master', { score: 2000, lines: 2, level: 1, durationMs: 200 })
    ).toThrow(AppError);
  });

  it('rejects forged chess checkmates', () => {
    expect(() =>
      validateSoloResult('chess', { result: 'win', reason: 'checkmate', moves: 1, durationMs: 5000 })
    ).toThrow(AppError);
    expect(() =>
      validateSoloResult('chess', { result: 'win', reason: 'checkmate', moves: 20, durationMs: 100 })
    ).toThrow(AppError);
  });

  it('accepts a valid chess computer result', () => {
    const result = validateSoloResult('chess', {
      result: 'win',
      reason: 'checkmate',
      moves: 24,
      durationMs: 90_000,
      mode: 'computer',
    });
    expect(result.result).toBe('win');
  });

  it('accepts a Coil Rush personal score and rejects instant high scores', () => {
    const result = validateSoloResult('snake-multiplayer', {
      score: 240,
      durationMs: 12_000,
      foodEaten: 8,
      kills: 1,
      length: 12,
    });
    expect(result.score).toBe(240);
    expect(() =>
      validateSoloResult('snake-multiplayer', { score: 400, durationMs: 100 })
    ).toThrow(AppError);
  });

  it('maps bot difficulty to ratings and scores to coin brackets', () => {
    expect(botEloForDifficulty('beginner')).toBe(800);
    expect(botEloForDifficulty('expert')).toBe(1600);
    expect(soloCoinsForScore(0)).toBe(5);
    expect(soloCoinsForScore(1200)).toBe(20);
    expect(soloCoinsForScore(8000)).toBe(50);
  });
});
