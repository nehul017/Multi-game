import api from '@/lib/api';
import { ApiResponse, Notification, PaginatedResponse } from '@/types';

export const notificationService = {
  getNotifications: async (page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<Notification>>> => {
    const { data } = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return data;
  },

  markAsRead: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data;
  },

  markAllAsRead: async (): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.put('/notifications/read-all');
    return data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const { data } = await api.get('/notifications/unread-count');
    return data;
  },

  deleteNotification: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },
};
