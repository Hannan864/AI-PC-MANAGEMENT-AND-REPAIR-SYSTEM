import api, { ApiResponse } from './api';

export interface GigData {
  id: string;
  technicianId: string;
  technicianName: string;
  title: string;
  description: string;
  category: string;
  price: number;
  estimatedTime: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGigPayload {
  title: string;
  description: string;
  category: 'Hardware' | 'Software' | 'Network' | 'Full Repair';
  price: number;
  estimated_time: string;
}

export const gigApi = {
  async list(params?: { category?: string; page?: number; per_page?: number }): Promise<GigData[]> {
    const res = await api.get<ApiResponse<GigData[]>>('/v1/gigs', { params });
    return res.data.data;
  },

  async get(id: string): Promise<GigData> {
    const res = await api.get<ApiResponse<GigData>>(`/v1/gigs/${id}`);
    return res.data.data;
  },

  async create(payload: CreateGigPayload): Promise<GigData> {
    const res = await api.post<ApiResponse<GigData>>('/v1/gigs', payload);
    return res.data.data;
  },

  async update(id: string, payload: Partial<CreateGigPayload & { is_available: boolean }>): Promise<GigData> {
    const res = await api.put<ApiResponse<GigData>>(`/v1/gigs/${id}`, payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/gigs/${id}`);
  },
};
