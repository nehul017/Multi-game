import { matchRepository } from '../repositories/match.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../utils/AppError';
import { IMatchDocument } from '../interfaces/match.interface';
import { gameEvents, EVENTS } from '../events';
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
    if (match.status !== 'waiting') throw new AppError('Match is not accepting players', 400);

    const alreadyJoined = match.players.some((p) => p.userId.toString() === userId);
    if (alreadyJoined) throw new AppError('Already in this match', 400);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    match.players.push({ userId, elo: user.elo, result: 'pending' } as any);
    await match.save();

    return match;
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
}

export const matchService = new MatchService();
