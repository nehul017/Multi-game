import api from '@/lib/api';
import { ApiResponse, Game, Match, Room, PaginatedResponse } from '@/types';

export const gameService = {
  getGames: async (): Promise<ApiResponse<Game[]>> => {
    const { data } = await api.get('/games?limit=100');
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

  joinMatch: async (matchId: string): Promise<ApiResponse<Match>> => {
    const { data } = await api.post(`/matches/${matchId}/join`);
    return data;
  },

  leaveMatch: async (matchId: string): Promise<ApiResponse<Match>> => {
    const { data } = await api.post(`/matches/${matchId}/leave`);
    return data;
  },

  getMatchResult: async (matchId: string): Promise<ApiResponse<Record<string, unknown>>> => {
    const { data } = await api.get(`/matches/${matchId}/result`);
    return data;
  },

  getPlayableGames: async (): Promise<ApiResponse<Array<{ gameId: string; gameType: string; name: string }>>> => {
    const { data } = await api.get('/games/playable');
    return data;
  },

  startSession: async (
    gameType: string,
    settings?: Record<string, unknown>
  ): Promise<ApiResponse<GameSessionPayload>> => {
    const { data } = await api.post('/matches/session', { gameType, gameId: gameType, settings });
    return data;
  },

  completeMatch: async (
    matchId: string,
    payload: GameCompletePayload
  ): Promise<ApiResponse<GameSessionPayload>> => {
    const { data } = await api.post(`/matches/${matchId}/complete`, payload);
    return data;
  },

  recordScore: async (
    matchId: string,
    payload: GameCompletePayload
  ): Promise<ApiResponse<GameSessionPayload>> => {
    const { data } = await api.post(`/matches/${matchId}/score`, payload);
    return data;
  },

  abortSession: async (matchId: string): Promise<ApiResponse<{ status: string }>> => {
    const { data } = await api.post(`/matches/${matchId}/abort`);
    return data;
  },
};

export interface GameCompletePayload {
  score?: number;
  lines?: number;
  level?: number;
  durationMs?: number;
  result?: 'win' | 'loss' | 'draw' | 'completed';
  reason?: string;
  moves?: number;
  captures?: number;
  foodEaten?: number;
  kills?: number;
  length?: number;
  mode?: string;
}

export interface GameSessionPayload {
  success?: boolean;
  gameId: string;
  sessionId: string;
  matchId: string;
  roomId: string;
  status: string;
  score?: number;
  result?: string;
  rewards?: {
    coins: number;
    xp: number;
    eloChange: number;
    balance: number;
  };
}
