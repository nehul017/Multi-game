import api from '@/lib/api';
import { ApiResponse, AuthResponse, User } from '@/types';

export const authService = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  register: async (username: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const { data } = await api.post('/auth/register', { username, email, password });
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.post('/auth/reset-password', { token, password });
    return data;
  },

  verifyEmail: async (token: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.get(`/auth/verify-email/${token}`);
    return data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};
