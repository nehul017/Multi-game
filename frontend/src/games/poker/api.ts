import api from '@/lib/api';
import type {
  LobbyTable,
  PokerGameState,
  PokerGameType,
  PokerHistoryItem,
  PokerPublicConfig,
} from './types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const pokerApi = {
  getGame: async () => {
    const { data } = await api.get<ApiResponse<{ config: PokerPublicConfig }>>('/games/poker');
    return data;
  },

  getConfig: async () => {
    const { data } = await api.get<ApiResponse<PokerPublicConfig>>('/games/poker/config');
    return data;
  },

  listTables: async (gameType?: PokerGameType) => {
    const query = gameType ? `?gameType=${gameType}` : '';
    const { data } = await api.get<ApiResponse<LobbyTable[]>>(`/games/poker/tables${query}`);
    return data;
  },

  getTable: async (tableId: string) => {
    const { data } = await api.get<ApiResponse<PokerGameState>>(`/games/poker/tables/${tableId}`);
    return data;
  },

  createTable: async (payload: {
    gameType: PokerGameType;
    name?: string;
    maxSeats?: number;
  }) => {
    const { data } = await api.post<ApiResponse<PokerGameState>>('/games/poker/tables', payload);
    return data;
  },

  sit: async (payload: { tableId: string; buyIn: number; seatIndex?: number }) => {
    const { data } = await api.post<ApiResponse<PokerGameState>>('/games/poker/sit', payload);
    return data;
  },

  getHistory: async (tableId?: string, limit = 20) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (tableId) params.set('tableId', tableId);
    const { data } = await api.get<ApiResponse<PokerHistoryItem[]>>(`/games/poker/history?${params.toString()}`);
    return data;
  },
};
