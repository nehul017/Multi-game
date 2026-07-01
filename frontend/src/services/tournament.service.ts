import api from '@/lib/api';
import { ApiResponse, Tournament, PaginatedResponse } from '@/types';

export const tournamentService = {
  getTournaments: async (page = 1, limit = 10, status?: string): Promise<ApiResponse<PaginatedResponse<Tournament>>> => {
    let url = `/tournaments?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    const { data } = await api.get(url);
    return data;
  },

  getTournament: async (id: string): Promise<ApiResponse<Tournament>> => {
    const { data } = await api.get(`/tournaments/${id}`);
    return data;
  },

  joinTournament: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.post(`/tournaments/${id}/join`);
    return data;
  },

  leaveTournament: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.post(`/tournaments/${id}/leave`);
    return data;
  },

  getBrackets: async (id: string): Promise<ApiResponse<Tournament['brackets']>> => {
    const { data } = await api.get(`/tournaments/${id}/brackets`);
    return data;
  },
};
