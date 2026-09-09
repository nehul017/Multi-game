import mongoose from 'mongoose';
import { matchService } from './match.service';
import { rewardService, MatchRewardSummary } from './reward.service';
import { leaderboardService } from './leaderboard.service';
import { economyService } from './economy.service';
import { gameRedisService } from './game-redis.service';
import { gameRegistry } from '../games/core/registry';
import { registerBuiltInGames } from '../games/core/register-games';
import { gameLogger } from '../games/core/logger';

registerBuiltInGames();
import { AppError } from '../utils/AppError';
import { XP_REWARDS } from '../utils/constants';
import {
  botEloForDifficulty,
  isSoloSessionAllowed,
  SCORE_LEADERBOARD_GAMES,
  SoloResultInput,
  soloCoinsForScore,
  ValidatedSoloResult,
  validateSoloResult,
} from '../games/core/result-validator';
import { IMatchDocument } from '../interfaces/match.interface';
import type { GameRoom } from '../games/core/types';

export interface SessionStartResult {
  success: true;
  gameId: string;
  sessionId: string;
  matchId: string;
  roomId: string;
  status: string;
}

export interface SessionCompleteResult {
  success: true;
  gameId: string;
  sessionId: string;
  matchId: string;
  roomId: string;
  score: number;
  result: string;
  status: string;
  rewards?: {
    coins: number;
    xp: number;
    eloChange: number;
    balance: number;
  };
}

const playerIdOf = (player: IMatchDocument['players'][number]): string => {
  const raw = player.userId as unknown;
  if (raw && typeof raw === 'object' && '_id' in (raw as object)) {
    return String((raw as { _id: unknown })._id);
  }
  return String(raw);
};

class GameResultService {
  async startSession(
    userId: string,
    gameType: string,
    settings: Record<string, unknown> = {}
  ): Promise<SessionStartResult> {
    if (!gameRegistry.has(gameType)) {
      throw new AppError('Invalid game ID', 400);
    }
    if (!isSoloSessionAllowed(gameType, settings)) {
      throw new AppError('This game starts through matchmaking or its dedicated API', 400);
    }

    const allowed = await gameRedisService.rateLimit(`session:${userId}`, 8, 60);
    if (!allowed) {
      throw new AppError('Too many game sessions. Please wait.', 429);
    }

    await matchService.abortPlayingSolo(userId, gameType);

    const match = await matchService.createMatch(gameType, userId, { ...settings, solo: true });
    const started = await matchService.updateMatchStatus(match._id.toString(), 'playing');
    const matchId = started._id.toString();

    const room: GameRoom = {
      matchId,
      roomId: started.roomId,
      gameType,
      players: new Map([[userId, { socketId: 'rest', ready: true, connected: true }]]),
      gameState: {},
      spectators: new Set(),
      engine: null,
      settings,
      lifecycle: 'active',
    };
    await gameRedisService.saveSession(room, { status: 'playing', lifecycle: 'active' });

    gameLogger.info('GAME_SESSION_CREATED', { gameType, matchId, roomId: started.roomId, userId });
    gameLogger.info('GAME_STARTED', { gameType, matchId, roomId: started.roomId, userId });

    return {
      success: true,
      gameId: gameType,
      sessionId: matchId,
      matchId,
      roomId: started.roomId,
      status: started.status,
    };
  }

  async completeSession(
    id: string,
    userId: string,
    payload: SoloResultInput
  ): Promise<SessionCompleteResult> {
    const allowed = await gameRedisService.rateLimit(`complete:${userId}`, 20, 60);
    if (!allowed) {
      throw new AppError('Too many result submissions. Please wait.', 429);
    }

    const match = await this.resolveMatch(id);
    this.assertMember(match, userId);

    const matchId = match._id.toString();
    if (['finished', 'draw', 'aborted'].includes(match.status)) {
      return this.toCompleteResponse(match, userId);
    }
    if (match.status !== 'playing') {
      throw new AppError('Session is not active', 409);
    }

    const validated = validateSoloResult(match.gameType, payload);
    if (match.gameType === 'chess' && validated.mode === 'local') {
      validated.result = 'completed';
    }
    const replayData = this.replayFromValidated(validated, userId);
    const versusBot = match.gameType === 'chess' && validated.mode === 'computer';

    let rewards: MatchRewardSummary | undefined;
    try {
      if (versusBot) {
        rewards = await this.grantRewards(match, userId, validated);
        await matchService.patchReplayData(matchId, replayData);
      } else {
        await matchService.finishSolo(matchId, userId, validated.result, replayData);
        rewards = await this.grantRewards(match, userId, validated);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      gameLogger.error('mongodb_error', { op: 'completeSession', matchId, error: String(error) });
      throw new AppError('Could not save game result', 500);
    }

    if (SCORE_LEADERBOARD_GAMES.has(match.gameType)) {
      await leaderboardService.recordHighScore(userId, match.gameType, validated.score);
    }

    await gameRedisService.saveSession(
      {
        matchId,
        roomId: match.roomId,
        gameType: match.gameType,
        players: new Map([[userId, { socketId: 'rest', ready: true, connected: false }]]),
        gameState: {},
        spectators: new Set(),
        engine: null,
        lifecycle: 'persisted',
      },
      { status: 'finished', lifecycle: 'persisted' }
    );

    gameLogger.info('GAME_COMPLETED', {
      gameType: match.gameType,
      matchId,
      userId,
      result: validated.result,
      score: validated.score,
    });
    gameLogger.info('GAME_RESULT_SAVED', { gameType: match.gameType, matchId, userId });

    const saved = await matchService.getMatch(matchId);
    return this.toCompleteResponse(saved, userId, rewards);
  }

  async recordScore(id: string, userId: string, payload: SoloResultInput): Promise<SessionCompleteResult> {
    const allowed = await gameRedisService.rateLimit(`score:${userId}`, 30, 60);
    if (!allowed) {
      throw new AppError('Too many score updates. Please wait.', 429);
    }

    const match = await this.resolveMatch(id);
    this.assertMember(match, userId);

    const validated = validateSoloResult(match.gameType, payload);
    const matchId = match._id.toString();
    const scores = {
      ...(((match.replayData || {}).playerScores as Record<string, unknown>) || {}),
      [userId]: this.replayFromValidated(validated, userId),
    };

    try {
      await matchService.patchReplayData(matchId, { playerScores: scores, lastScoreAt: new Date().toISOString() });
    } catch (error) {
      gameLogger.error('mongodb_error', { op: 'recordScore', matchId, error: String(error) });
      throw new AppError('Could not save score', 500);
    }

    if (SCORE_LEADERBOARD_GAMES.has(match.gameType) || match.gameType === 'snake-multiplayer') {
      await leaderboardService.recordHighScore(userId, match.gameType, validated.score);
    }

    gameLogger.info('GAME_ACTION', { gameType: match.gameType, matchId, userId, action: 'score', score: validated.score });

    return {
      success: true,
      gameId: match.gameType,
      sessionId: matchId,
      matchId,
      roomId: match.roomId,
      score: validated.score,
      result: match.status,
      status: match.status,
    };
  }

  async abortSession(id: string, userId: string): Promise<void> {
    const match = await this.resolveMatch(id);
    this.assertMember(match, userId);
    if (['finished', 'draw', 'aborted'].includes(match.status)) return;
    await matchService.updateMatchStatus(match._id.toString(), 'aborted');
    gameLogger.info('GAME_COMPLETED', {
      gameType: match.gameType,
      matchId: match._id.toString(),
      userId,
      result: 'aborted',
    });
  }

  private async grantRewards(
    match: IMatchDocument,
    userId: string,
    validated: ValidatedSoloResult
  ): Promise<MatchRewardSummary | undefined> {
    const matchId = match._id.toString();

    if (match.gameType === 'chess' && validated.mode === 'computer') {
      const summaries = await rewardService.settleSoloVersusBot(
        matchId,
        userId,
        validated.result === 'completed' ? 'draw' : validated.result,
        botEloForDifficulty(match.settings?.difficulty)
      );
      return summaries.find((row) => row.userId === userId);
    }

    if (match.gameType === 'chess' && validated.mode === 'local') {
      const coins = 10;
      const xp = XP_REWARDS.GAME_PLAYED + XP_REWARDS.DRAW;
      const credited = await economyService.rewardMatchResult(userId, 'draw', matchId, match.gameType);
      await economyService.addXp(userId, xp);
      return {
        userId,
        result: 'draw',
        coins,
        xp,
        eloChange: 0,
        newElo: 0,
        newLevel: 0,
        balance: credited.coins,
        achievements: [],
      };
    }

    if (SCORE_LEADERBOARD_GAMES.has(match.gameType)) {
      const coins = soloCoinsForScore(validated.score);
      const xp = XP_REWARDS.GAME_PLAYED + Math.min(40, Math.floor(validated.score / 250));
      const credited = await economyService.creditCoins(
        userId,
        coins,
        'match_draw',
        `Completed ${match.gameType}`,
        { matchId, gameType: match.gameType, score: validated.score }
      );
      await economyService.addXp(userId, xp);
      return {
        userId,
        result: 'draw',
        coins,
        xp,
        eloChange: 0,
        newElo: 0,
        newLevel: 0,
        balance: credited.coins,
        achievements: [],
      };
    }

    return undefined;
  }

  private replayFromValidated(validated: ValidatedSoloResult, userId: string): Record<string, unknown> {
    return {
      userId,
      score: validated.score,
      lines: validated.lines,
      level: validated.level,
      durationMs: validated.durationMs,
      result: validated.result,
      reason: validated.reason,
      moves: validated.moves,
      captures: validated.captures,
      foodEaten: validated.foodEaten,
      kills: validated.kills,
      length: validated.length,
      mode: validated.mode,
      verified: true,
    };
  }

  private async resolveMatch(id: string): Promise<IMatchDocument> {
    if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
      try {
        return await matchService.getMatch(id);
      } catch {
        // fall through to room lookup
      }
    }
    return matchService.getMatchByRoom(id);
  }

  private assertMember(match: IMatchDocument, userId: string): void {
    const member = match.players.some((player) => playerIdOf(player) === userId);
    if (!member) {
      throw new AppError('You are not part of this session', 403);
    }
  }

  private toCompleteResponse(
    match: IMatchDocument,
    userId: string,
    rewards?: MatchRewardSummary
  ): SessionCompleteResult {
    const replay = (match.replayData || {}) as Record<string, unknown>;
    const score = typeof replay.score === 'number' ? replay.score : 0;
    return {
      success: true,
      gameId: match.gameType,
      sessionId: match._id.toString(),
      matchId: match._id.toString(),
      roomId: match.roomId,
      score,
      result: typeof replay.result === 'string' ? replay.result : match.status,
      status: match.status,
      rewards: rewards
        ? {
            coins: rewards.coins,
            xp: rewards.xp,
            eloChange: rewards.eloChange,
            balance: rewards.balance,
          }
        : undefined,
    };
    void userId;
  }
}

export const gameResultService = new GameResultService();
