import api from '@/lib/api';
import type { FruitSlotsHistoryItem, PublicFruitSlotsConfig } from './types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const fruitSlotsApi = {
  getGame: async () => {
    const { data } = await api.get<ApiResponse<{ config: PublicFruitSlotsConfig }>>(
      '/games/classic-fruit-slots'
    );
    return data;
  },

  getConfig: async () => {
    const { data } = await api.get<ApiResponse<PublicFruitSlotsConfig>>('/games/classic-fruit-slots/config');
    return data;
  },

  getHistory: async (limit = 20) => {
    const { data } = await api.get<ApiResponse<FruitSlotsHistoryItem[]>>(
      `/games/classic-fruit-slots/history?limit=${limit}`
    );
    return data;
  },
};
