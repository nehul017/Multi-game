import { matchService } from './match.service';

class GameHistoryService {
  async getHistory(gameType: string, page = 1, limit = 20) {
    return matchService.getMatchesByGame(gameType, page, limit);
  }

  async getResult(matchId: string) {
    return matchService.getMatchResult(matchId);
  }

  async getReplay(matchId: string) {
    return matchService.getReplay(matchId);
  }
}

export const gameHistoryService = new GameHistoryService();
