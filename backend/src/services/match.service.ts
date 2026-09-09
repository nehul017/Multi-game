import { matchRepository } from '../repositories/match.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../utils/AppError';
import { IMatchDocument } from '../interfaces/match.interface';
import { gameEvents, EVENTS } from '../events';
import { JOIN_IN_PROGRESS_GAMES, maxPlayersFor } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

class MatchService {
  async createMatch(gameType: string, creatorId: string, settings: Record<string, unknown> = {}): Promise<IMatchDocument> {
    const user = await userRepository.findById(creatorId);
    if (!user) throw new AppError('User not found', 404);

    const match = await matchRepository.create({
      gameType,
      players: [{ userId: creatorId, elo: user.elo, result: 'pending' }],
      roomId: uuidv4(),
      status: 'waiting',
      settings,
    } as any);

    gameEvents.emit(EVENTS.MATCH_CREATED, { matchId: match._id, gameType });

    return match;
  }

  async getMatch(matchId: string): Promise<IMatchDocument> {
    const match = await matchRepository.findById(matchId, 'players.userId winner spectators');
    if (!match) throw new AppError('Match not found', 404);
    return match;
  }

  async getMatchByRoom(roomId: string): Promise<IMatchDocument> {
    const match = await matchRepository.findByRoomId(roomId);
    if (!match) throw new AppError('Match not found', 404);
    return match;
  }

  async getMatchesByUser(userId: string, page: number = 1, limit: number = 20) {
    return matchRepository.findByUser(userId, page, limit);
  }

  async getMatchesByGame(gameType: string, page: number = 1, limit: number = 20) {
    return matchRepository.findByGame(gameType, page, limit);
  }

  async joinMatch(matchId: string, userId: string): Promise<IMatchDocument> {
    const match = await matchRepository.findById(matchId);
    if (!match) throw new AppError('Match not found', 404);

    const alreadyJoined = match.players.some((p) => p.userId.toString() === userId);
    if (alreadyJoined) return match;

    const canJoinPlaying =
      match.status === 'playing' && JOIN_IN_PROGRESS_GAMES.has(match.gameType);
    if (match.status !== 'waiting' && !canJoinPlaying) {
      throw new AppError('Match is not accepting players', 400);
    }

    const maxPlayers = maxPlayersFor(match.gameType);
    if (match.players.length >= maxPlayers) {
      throw new AppError('Match is full', 400);
    }

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    match.players.push({ userId, elo: user.elo, result: 'pending' } as any);
    await match.save();

    return match;
  }

  async abortPlayingSolo(userId: string, gameType: string): Promise<number> {
    return matchRepository.abortPlayingSolo(userId, gameType);
  }

  async updateMatchStatus(matchId: string, status: 'waiting' | 'playing' | 'finished' | 'draw' | 'aborted'): Promise<IMatchDocument> {
    const updateData: Record<string, unknown> = { status };

    if (status === 'playing') {
      updateData.startedAt = new Date();
    }
    if (['finished', 'draw', 'aborted'].includes(status)) {
      updateData.finishedAt = new Date();
    }

    const match = await matchRepository.updateById(matchId, updateData);
    if (!match) throw new AppError('Match not found', 404);

    if (status === 'playing') {
      gameEvents.emit(EVENTS.MATCH_STARTED, { matchId });
    }
    if (['finished', 'draw'].includes(status)) {
      gameEvents.emit(EVENTS.MATCH_ENDED, { matchId, status });
    }

    return match;
  }

  async addMove(matchId: string, playerId: string, action: string, data: Record<string, unknown>): Promise<IMatchDocument> {
    const match = await matchRepository.addMove(matchId, { player: playerId, action, data });
    if (!match) throw new AppError('Match not found', 404);

    gameEvents.emit(EVENTS.MATCH_MOVE, { matchId, playerId, action, data });

    return match;
  }

  async setWinner(matchId: string, winnerId: string): Promise<IMatchDocument> {
    const match = await matchRepository.findById(matchId);
    if (!match) throw new AppError('Match not found', 404);

    match.winner = winnerId as any;
    match.status = 'finished';
    match.finishedAt = new Date();

    for (const player of match.players) {
      if (player.userId.toString() === winnerId) {
        player.result = 'win';
        await userRepository.incrementStats(winnerId, 'wins');
      } else {
        player.result = 'loss';
        await userRepository.incrementStats(player.userId.toString(), 'losses');
      }
      await userRepository.incrementStats(player.userId.toString(), 'gamesPlayed');
    }

    await match.save();

    gameEvents.emit(EVENTS.MATCH_ENDED, { matchId, winnerId });

    return match;
  }

  async setDraw(matchId: string): Promise<IMatchDocument> {
    const match = await matchRepository.findById(matchId);
    if (!match) throw new AppError('Match not found', 404);

    match.status = 'draw';
    match.finishedAt = new Date();

    for (const player of match.players) {
      player.result = 'draw';
      await userRepository.incrementStats(player.userId.toString(), 'draws');
      await userRepository.incrementStats(player.userId.toString(), 'gamesPlayed');
    }

    await match.save();
    return match;
  }

  async getReplay(matchId: string): Promise<{ moves: unknown[]; replayData: unknown }> {
    const match = await matchRepository.findById(matchId);
    if (!match) throw new AppError('Match not found', 404);
    return { moves: match.moves, replayData: match.replayData };
  }

  async getWaitingMatches(gameType: string): Promise<IMatchDocument[]> {
    return matchRepository.findWaitingMatches(gameType);
  }

  async leaveMatch(matchId: string, userId: string): Promise<IMatchDocument> {
    const match = await matchRepository.findById(matchId);
    if (!match) throw new AppError('Match not found', 404);

    if (match.status === 'playing') {
      throw new AppError('Leave a live match through the game socket', 400);
    }

    match.players = match.players.filter((player) => player.userId.toString() !== userId) as typeof match.players;
    if (match.players.length === 0) {
      match.status = 'aborted';
      match.finishedAt = new Date();
    }
    await match.save();
    return match;
  }

  async finishSolo(
    matchId: string,
    userId: string,
    result: 'win' | 'loss' | 'draw' | 'completed',
    replayData: Record<string, unknown>
  ): Promise<IMatchDocument> {
    const match = await matchRepository.findById(matchId);
    if (!match) throw new AppError('Match not found', 404);
    if (['finished', 'draw', 'aborted'].includes(match.status)) return match;

    match.replayData = { ...(match.replayData || {}), ...replayData };
    match.finishedAt = new Date();

    const player = match.players.find((entry) => entry.userId.toString() === userId);
    if (result === 'win') {
      match.status = 'finished';
      match.winner = userId as IMatchDocument['winner'];
      if (player) player.result = 'win';
      await userRepository.incrementStats(userId, 'wins');
    } else if (result === 'loss') {
      match.status = 'finished';
      if (player) player.result = 'loss';
      await userRepository.incrementStats(userId, 'losses');
    } else {
      match.status = result === 'draw' ? 'draw' : 'finished';
      if (player) player.result = result === 'draw' ? 'draw' : 'draw';
      await userRepository.incrementStats(userId, 'draws');
    }

    await userRepository.incrementStats(userId, 'gamesPlayed');
    await match.save();
    gameEvents.emit(EVENTS.MATCH_ENDED, { matchId, status: match.status });
    return match;
  }

  async patchReplayData(matchId: string, replayData: Record<string, unknown>): Promise<IMatchDocument> {
    const match = await matchRepository.findById(matchId);
    if (!match) throw new AppError('Match not found', 404);
    match.replayData = { ...(match.replayData || {}), ...replayData };
    await match.save();
    return match;
  }

  async getMatchResult(matchId: string) {
    const match = await this.getMatch(matchId);
    if (!['finished', 'draw', 'aborted'].includes(match.status)) {
      throw new AppError('Match result is not available yet', 409);
    }

    return {
      matchId,
      gameType: match.gameType,
      status: match.status,
      winner: match.winner,
      players: match.players,
      roomId: match.roomId,
      startedAt: match.startedAt,
      finishedAt: match.finishedAt,
      settings: match.settings,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    };
  }
}

export const matchService = new MatchService();
