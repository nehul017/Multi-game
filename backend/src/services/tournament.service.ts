import { tournamentRepository } from '../repositories/tournament.repository';
import { AppError } from '../utils/AppError';
import { ITournamentDocument, IBracketMatch } from '../interfaces/tournament.interface';
import { gameEvents, EVENTS } from '../events';

class TournamentService {
  async createTournament(data: Partial<ITournamentDocument>, creatorId: string): Promise<ITournamentDocument> {
    const tournament = await tournamentRepository.create({
      ...data,
      createdBy: creatorId,
      status: 'upcoming',
    } as any);

    return tournament;
  }

  async getTournaments(page: number = 1, limit: number = 20, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    return tournamentRepository.findMany(filter, {
      page,
      limit,
      sort: '-createdAt',
      populate: 'createdBy participants',
    });
  }

  async getTournament(id: string): Promise<ITournamentDocument> {
    const tournament = await tournamentRepository.findById(id, 'createdBy participants');
    if (!tournament) throw new AppError('Tournament not found', 404);
    return tournament;
  }

  async joinTournament(tournamentId: string, userId: string): Promise<ITournamentDocument> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) throw new AppError('Tournament not found', 404);

    if (!['upcoming', 'registration'].includes(tournament.status)) {
      throw new AppError('Tournament is not accepting registrations', 400);
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      throw new AppError('Tournament is full', 400);
    }

    const isAlreadyIn = await tournamentRepository.isParticipant(tournamentId, userId);
    if (isAlreadyIn) throw new AppError('Already registered', 400);

    const updated = await tournamentRepository.addParticipant(tournamentId, userId);
    if (!updated) throw new AppError('Failed to join tournament', 500);

    return updated;
  }

  async leaveTournament(tournamentId: string, userId: string): Promise<void> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) throw new AppError('Tournament not found', 404);

    if (!['upcoming', 'registration'].includes(tournament.status)) {
      throw new AppError('Cannot leave an active tournament', 400);
    }

    await tournamentRepository.removeParticipant(tournamentId, userId);
  }

  async generateBrackets(tournamentId: string): Promise<ITournamentDocument> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) throw new AppError('Tournament not found', 404);

    if (tournament.participants.length < 2) {
      throw new AppError('Not enough participants', 400);
    }

    const participants = [...tournament.participants];
    this.shuffleArray(participants);

    const brackets: IBracketMatch[] = [];

    if (tournament.format === 'single_elimination') {
      const totalRounds = Math.ceil(Math.log2(participants.length));
      let matchNumber = 0;

      for (let i = 0; i < participants.length; i += 2) {
        matchNumber++;
        brackets.push({
          round: 1,
          matchNumber,
          player1: participants[i]?.toString() || null,
          player2: participants[i + 1]?.toString() || null,
          winner: null,
          score1: 0,
          score2: 0,
          status: 'pending',
        });
      }

      let matchesInRound = Math.ceil(participants.length / 4);
      for (let round = 2; round <= totalRounds; round++) {
        for (let i = 0; i < matchesInRound; i++) {
          matchNumber++;
          brackets.push({
            round,
            matchNumber,
            player1: null,
            player2: null,
            winner: null,
            score1: 0,
            score2: 0,
            status: 'pending',
          });
        }
        matchesInRound = Math.ceil(matchesInRound / 2);
      }

      tournament.rounds = totalRounds;
    } else if (tournament.format === 'round_robin') {
      let matchNumber = 0;
      for (let i = 0; i < participants.length; i++) {
        for (let j = i + 1; j < participants.length; j++) {
          matchNumber++;
          brackets.push({
            round: 1,
            matchNumber,
            player1: participants[i].toString(),
            player2: participants[j].toString(),
            winner: null,
            score1: 0,
            score2: 0,
            status: 'pending',
          });
        }
      }
      tournament.rounds = 1;
    }

    tournament.brackets = brackets;
    tournament.currentRound = 1;
    tournament.status = 'in_progress';
    await tournament.save();

    gameEvents.emit(EVENTS.TOURNAMENT_STARTED, { tournamentId });

    return tournament;
  }

  async updateBracket(
    tournamentId: string,
    matchNumber: number,
    winnerId: string,
    score1: number,
    score2: number
  ): Promise<ITournamentDocument> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) throw new AppError('Tournament not found', 404);

    const bracketMatch = tournament.brackets.find((b) => b.matchNumber === matchNumber);
    if (!bracketMatch) throw new AppError('Bracket match not found', 404);

    bracketMatch.winner = winnerId;
    bracketMatch.score1 = score1;
    bracketMatch.score2 = score2;
    bracketMatch.status = 'completed';

    if (tournament.format === 'single_elimination') {
      const currentRoundMatches = tournament.brackets.filter(
        (b) => b.round === bracketMatch.round
      );
      const allComplete = currentRoundMatches.every((m) => m.status === 'completed');

      if (allComplete) {
        const nextRoundMatches = tournament.brackets.filter(
          (b) => b.round === bracketMatch.round + 1
        );

        if (nextRoundMatches.length > 0) {
          const winners = currentRoundMatches.map((m) => m.winner);
          for (let i = 0; i < nextRoundMatches.length; i++) {
            nextRoundMatches[i].player1 = winners[i * 2] || null;
            nextRoundMatches[i].player2 = winners[i * 2 + 1] || null;
          }
          tournament.currentRound = bracketMatch.round + 1;

          gameEvents.emit(EVENTS.TOURNAMENT_ROUND_COMPLETE, {
            tournamentId,
            round: bracketMatch.round,
          });
        } else {
          tournament.status = 'completed';
          tournament.endDate = new Date();
          gameEvents.emit(EVENTS.TOURNAMENT_ENDED, { tournamentId, winner: winnerId });
        }
      }
    }

    await tournament.save();
    return tournament;
  }

  async getResults(tournamentId: string) {
    const tournament = await tournamentRepository.findById(tournamentId, 'participants');
    if (!tournament) throw new AppError('Tournament not found', 404);

    const standings: Record<string, { wins: number; losses: number; draws: number; points: number }> = {};

    for (const p of tournament.participants) {
      standings[p.toString()] = { wins: 0, losses: 0, draws: 0, points: 0 };
    }

    for (const bracket of tournament.brackets) {
      if (bracket.status === 'completed' && bracket.winner) {
        const loserId =
          bracket.player1 === bracket.winner ? bracket.player2 : bracket.player1;

        if (standings[bracket.winner]) {
          standings[bracket.winner].wins++;
          standings[bracket.winner].points += 3;
        }
        if (loserId && standings[loserId]) {
          standings[loserId].losses++;
        }
      }
    }

    return {
      tournament,
      standings: Object.entries(standings)
        .map(([userId, stats]) => ({ userId, ...stats }))
        .sort((a, b) => b.points - a.points),
    };
  }

  async deleteTournament(tournamentId: string, userId: string): Promise<void> {
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) throw new AppError('Tournament not found', 404);
    if (tournament.createdBy.toString() !== userId) {
      throw new AppError('Not authorized to delete this tournament', 403);
    }
    if (tournament.status === 'in_progress') {
      throw new AppError('Cannot delete an active tournament', 400);
    }
    await tournamentRepository.deleteById(tournamentId);
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

export const tournamentService = new TournamentService();
