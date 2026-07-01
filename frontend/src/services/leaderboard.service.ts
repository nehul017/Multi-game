import api from '@/lib/api';
import { ApiResponse, LeaderboardEntry, PaginatedResponse } from '@/types';

export const leaderboardService = {
  getLeaderboard: async (
    period: 'daily' | 'weekly' | 'monthly' | 'all' = 'all',
    gameSlug?: string,
    page = 1,
    limit = 50
  ): Promise<ApiResponse<PaginatedResponse<LeaderboardEntry>>> => {
    const gameType = gameSlug || 'all';
    const backendPeriod = period === 'all' ? 'all_time' : period;
    const { data } = await api.get(`/leaderboard/${gameType}?period=${backendPeriod}&page=${page}&limit=${limit}`);
    return data;
  },

  getRank: async (userId: string, gameType = 'all'): Promise<ApiResponse<{ rank: number; elo: number; tier: string }>> => {
    const { data } = await api.get(`/leaderboard/${gameType}/rank/${userId}`);
    return data;
  },

  getTopPlayers: async (limit = 10, gameType = 'all'): Promise<ApiResponse<LeaderboardEntry[]>> => {
    const { data } = await api.get(`/leaderboard/${gameType}?period=all_time&page=1&limit=${limit}`);
    return data;
  },
};
