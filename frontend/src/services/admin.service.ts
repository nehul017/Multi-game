import api from '@/lib/api';
import { ApiResponse, AdminStats, ServerHealth, User, Game, Tournament, PaginatedResponse } from '@/types';

export const adminService = {
  getDashboard: async (): Promise<ApiResponse<AdminStats>> => {
    const { data } = await api.get('/admin/dashboard');
    return data;
  },

  getUsers: async (page = 1, limit = 20, search?: string): Promise<ApiResponse<PaginatedResponse<User>>> => {
    let url = `/admin/users?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const { data } = await api.get(url);
    return data;
  },

  getUser: async (userId: string): Promise<ApiResponse<User>> => {
    const { data } = await api.get(`/admin/users/${userId}`);
    return data;
  },

  banUser: async (userId: string, reason: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.post(`/admin/users/${userId}/ban`, { reason });
    return data;
  },

  unbanUser: async (userId: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.post(`/admin/users/${userId}/unban`);
    return data;
  },

  deleteUser: async (userId: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.delete(`/admin/users/${userId}`);
    return data;
  },

  makeAdmin: async (userId: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.post(`/admin/users/${userId}/make-admin`);
    return data;
  },

  getGames: async (): Promise<ApiResponse<Game[]>> => {
    const { data } = await api.get('/games');
    return data;
  },

  createGame: async (gameData: Partial<Game>): Promise<ApiResponse<Game>> => {
    const { data } = await api.post('/games', gameData);
    return data;
  },

  updateGame: async (gameId: string, updates: Partial<Game>): Promise<ApiResponse<Game>> => {
    const { data } = await api.put(`/games/${gameId}`, updates);
    return data;
  },

  toggleGame: async (gameId: string, isActive: boolean): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.put(`/games/${gameId}`, { isActive });
    return data;
  },

  getTournaments: async (): Promise<ApiResponse<Tournament[]>> => {
    const { data } = await api.get('/tournaments');
    return data;
  },

  createTournament: async (tournamentData: Partial<Tournament>): Promise<ApiResponse<Tournament>> => {
    const { data } = await api.post('/tournaments', tournamentData);
    return data;
  },

  updateTournament: async (id: string, updates: Partial<Tournament>): Promise<ApiResponse<Tournament>> => {
    const { data } = await api.put(`/tournaments/${id}`, updates);
    return data;
  },

  deleteTournament: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.delete(`/tournaments/${id}`);
    return data;
  },

  getReports: async (status?: string): Promise<ApiResponse<Array<{ id: string; reportedUser: User; reporter: User; reason: string; status: string; createdAt: string }>>> => {
    let url = '/admin/reports';
    if (status) url += `?status=${status}`;
    const { data } = await api.get(url);
    return data;
  },

  resolveReport: async (reportId: string, action: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.put(`/admin/reports/${reportId}/resolve`, { action });
    return data;
  },

  getHealth: async (): Promise<ApiResponse<ServerHealth>> => {
    const { data } = await api.get('/admin/health');
    return data;
  },

  broadcast: async (title: string, message: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.post('/admin/broadcast', { title, message });
    return data;
  },

  getSettings: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    const { data } = await api.get('/admin/settings');
    return data;
  },

  updateSettings: async (settings: Record<string, unknown>): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.put('/admin/settings', settings);
    return data;
  },
};
