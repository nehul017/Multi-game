import api from '@/lib/api';
import { ApiResponse, User, UserProfile, Friend, FriendRequest, Match, PaginatedResponse } from '@/types';

export const userService = {
  getProfile: async (userId?: string): Promise<ApiResponse<UserProfile>> => {
    const url = userId ? `/users/profile/${userId}` : '/users/profile';
    const { data } = await api.get(url);
    return data;
  },

  updateProfile: async (updates: Partial<User>): Promise<ApiResponse<User>> => {
    const { data } = await api.put('/users/update', updates);
    return data;
  },

  uploadAvatar: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.put('/users/change-password', { currentPassword, newPassword });
    return data;
  },

  searchUsers: async (query: string): Promise<ApiResponse<User[]>> => {
    const { data } = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return data;
  },

  getFriends: async (): Promise<ApiResponse<Friend[]>> => {
    const { data } = await api.get('/users/friends');
    return data;
  },

  getFriendRequests: async (): Promise<ApiResponse<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>> => {
    const [pendingRes, sentRes] = await Promise.all([
      api.get('/users/friend-requests/pending'),
      api.get('/users/friend-requests/sent'),
    ]);
    return {
      success: true,
      data: {
        incoming: pendingRes.data.data || [],
        outgoing: sentRes.data.data || [],
      },
    };
  },

  sendFriendRequest: async (userId: string): Promise<ApiResponse<FriendRequest>> => {
    const { data } = await api.post(`/users/friend-request/${userId}`);
    return data;
  },

  acceptFriend: async (requestId: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.put(`/users/friend-request/${requestId}/accept`);
    return data;
  },

  rejectFriend: async (requestId: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.put(`/users/friend-request/${requestId}/reject`);
    return data;
  },

  removeFriend: async (userId: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.delete(`/users/friends/${userId}`);
    return data;
  },

  getMatchHistory: async (userId?: string, page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<Match>>> => {
    const url = userId ? `/users/match-history/${userId}` : '/users/match-history';
    const { data } = await api.get(`${url}?page=${page}&limit=${limit}`);
    return data;
  },

  getStats: async (userId?: string): Promise<ApiResponse<UserProfile['stats']>> => {
    const url = userId ? `/users/stats/${userId}` : '/users/stats';
    const { data } = await api.get(url);
    return data;
  },
};
