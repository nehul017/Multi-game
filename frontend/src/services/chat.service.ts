import api from '@/lib/api';
import { ApiResponse, Conversation, Message, PaginatedResponse } from '@/types';

export const chatService = {
  getConversations: async (): Promise<ApiResponse<Conversation[]>> => {
    const { data } = await api.get('/chat/conversations');
    return data;
  },

  getMessages: async (userId: string, page = 1, limit = 50): Promise<ApiResponse<PaginatedResponse<Message>>> => {
    const { data } = await api.get(`/chat/messages/${userId}?page=${page}&limit=${limit}`);
    return data;
  },

  getRoomMessages: async (roomId: string): Promise<ApiResponse<Message[]>> => {
    const { data } = await api.get(`/chat/room/${roomId}`);
    return data;
  },

  sendMessage: async (receiverId: string, content: string, type = 'text', room?: string): Promise<ApiResponse<Message>> => {
    const { data } = await api.post('/chat/messages', { receiver: receiverId, content, type, room });
    return data;
  },

  markAsRead: async (senderId: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.put(`/chat/read/${senderId}`);
    return data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const { data } = await api.get('/chat/unread');
    return data;
  },

  deleteMessage: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await api.delete(`/chat/messages/${id}`);
    return data;
  },
};
