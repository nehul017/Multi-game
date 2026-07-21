import api from '@/lib/api';
import { ApiResponse } from '@/types';

export interface PlatformStatus {
  maintenanceMode: boolean;
}

export const platformService = {
  getStatus: async (): Promise<ApiResponse<PlatformStatus>> => {
    const { data } = await api.get('/platform/status');
    return data;
  },
};
