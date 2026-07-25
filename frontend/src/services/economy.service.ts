import api from '@/lib/api';
import {
  ApiResponse,
  Wallet,
  DailyLoginStatus,
  ClaimDailyLoginResult,
  CoinPack,
  PurchasePackResult,
  Mission,
  ClaimMissionResult,
  StoreItem,
  StoreItemType,
  PurchaseItemResult,
  InventoryResponse,
  EquippedItems,
  InventoryEntry,
  CoinTransaction,
  EconomyPage,
} from '@/types';

export const economyService = {
  getWallet: async (): Promise<ApiResponse<Wallet>> => {
    const { data } = await api.get('/economy/wallet');
    return data;
  },

  getTransactions: async (page = 1, limit = 20): Promise<ApiResponse<EconomyPage<CoinTransaction>>> => {
    const { data } = await api.get(`/economy/transactions?page=${page}&limit=${limit}`);
    return data;
  },

  getDailyLoginStatus: async (): Promise<ApiResponse<DailyLoginStatus>> => {
    const { data } = await api.get('/economy/daily-login');
    return data;
  },

  claimDailyLogin: async (): Promise<ApiResponse<ClaimDailyLoginResult>> => {
    const { data } = await api.post('/economy/daily-login/claim');
    return data;
  },

  getCoinPacks: async (): Promise<ApiResponse<CoinPack[]>> => {
    const { data } = await api.get('/economy/packs');
    return data;
  },

  purchasePack: async (packId: string): Promise<ApiResponse<PurchasePackResult>> => {
    const { data } = await api.post(`/economy/packs/${packId}/purchase`);
    return data;
  },

  getMissions: async (): Promise<ApiResponse<Mission[]>> => {
    const { data } = await api.get('/economy/missions');
    return data;
  },

  claimMission: async (missionId: string): Promise<ApiResponse<ClaimMissionResult>> => {
    const { data } = await api.post(`/economy/missions/${missionId}/claim`);
    return data;
  },

  getCatalog: async (
    type?: StoreItemType,
    page = 1,
    limit = 50
  ): Promise<ApiResponse<EconomyPage<StoreItem>>> => {
    let url = `/economy/store?page=${page}&limit=${limit}`;
    if (type) url += `&type=${type}`;
    const { data } = await api.get(url);
    return data;
  },

  purchaseItem: async (itemId: string): Promise<ApiResponse<PurchaseItemResult>> => {
    const { data } = await api.post(`/economy/store/${itemId}/purchase`);
    return data;
  },

  getInventory: async (): Promise<ApiResponse<InventoryResponse>> => {
    const { data } = await api.get('/economy/inventory');
    return data;
  },

  equipItem: async (itemId: string): Promise<ApiResponse<{ equipped: EquippedItems; inventory: InventoryEntry[] }>> => {
    const { data } = await api.post(`/economy/inventory/${itemId}/equip`);
    return data;
  },

  unequipItem: async (itemId: string): Promise<ApiResponse<{ equipped: EquippedItems; inventory: InventoryEntry[] }>> => {
    const { data } = await api.post(`/economy/inventory/${itemId}/unequip`);
    return data;
  },
};
