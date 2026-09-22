import api, { ApiResponse, PaginatedData } from './api';

export interface UserHistoryData {
  historyId: string;
  userId: string;
  type: string;
  referenceId: string | null;
  title: string;
  summary: string | null;
  timestamp: number;
}

export const userHistoryApi = {
  async list(params?: {
    type?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedData<UserHistoryData>> {
    const res = await api.get<ApiResponse<PaginatedData<UserHistoryData>>>('/v1/user/history', { params });
    return res.data.data;
  },
};
