import api from '@/lib/api';
import { ApiResponse, Game, Match, Room, PaginatedResponse } from '@/types';

export const gameService = {
  getGames: async (): Promise<ApiResponse<Game[]>> => {
    const { data } = await api.get('/games');
    return data;
  },

  getGame: async (slug: string): Promise<ApiResponse<Game>> => {
    const { data } = await api.get(`/games/slug/${slug}`);
    return data;
  },

  getGameById: async (id: string): Promise<ApiResponse<Game>> => {
    const { data } = await api.get(`/games/${id}`);
    return data;
  },

  getRooms: async (gameSlug: string): Promise<ApiResponse<Room[]>> => {
    const { data } = await api.get(`/matches/waiting/${gameSlug}`);
    return data;
  },

  createRoom: async (_gameSlug: string, roomData: { name: string; isPrivate: boolean; maxPlayers: number; password?: string }): Promise<ApiResponse<Room>> => {
    const { data } = await api.post('/matches', roomData);
    return data;
  },

  createMatch: async (gameType: string, settings?: Record<string, unknown>): Promise<ApiResponse<Match>> => {
    const { data } = await api.post('/matches', { gameType, settings });
    return data;
  },

  getMatch: async (matchId: string): Promise<ApiResponse<Match>> => {
    const { data } = await api.get(`/matches/${matchId}`);
    return data;
  },

  getMatches: async (page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<Match>>> => {
    const { data } = await api.get(`/matches/user/me?page=${page}&limit=${limit}`);
    return data;
  },

  getReplay: async (matchId: string): Promise<ApiResponse<{ moves: Match['moves']; players: Match['players'] }>> => {
    const { data } = await api.get(`/matches/${matchId}/replay`);
    return data;
  },
};
