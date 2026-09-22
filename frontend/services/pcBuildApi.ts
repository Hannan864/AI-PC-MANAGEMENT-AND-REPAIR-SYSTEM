import api, { ApiResponse, PaginatedData } from './api';

export interface PCBuildData {
  id: string;
  buildName: string;
  userId: string;
  technicianId: string | null;
  cpu: string;
  gpu: string;
  motherboard: string;
  ram: string;
  storage: string;
  powerSupply: string;
  chassis: string | null;
  estimatedCostUsd: number | null;
  estimatedCostPkr: number | null;
  compatibilityStatus: 'pass' | 'warning' | 'fail';
  performanceScore: number;
  issues: string[];
  bottlenecks: string[];
  status: 'draft' | 'submitted_review' | 'under_review' | 'reviewed' | 'rejected' | 'in_progress' | 'completed';
  userNotes: string | null;
  technicianNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuildPayload {
  build_name: string;
  cpu: string;
  gpu: string;
  motherboard: string;
  ram: string;
  storage: string;
  power_supply: string;
  chassis?: string;
  user_notes?: string;
}

export const pcBuildApi = {
  async list(params?: { status?: string; page?: number; per_page?: number }): Promise<PaginatedData<PCBuildData>> {
    const res = await api.get<ApiResponse<PaginatedData<PCBuildData>>>('/v1/pc-builds', { params });
    return res.data.data;
  },

  async get(id: string): Promise<PCBuildData> {
    const res = await api.get<ApiResponse<PCBuildData>>(`/v1/pc-builds/${id}`);
    return res.data.data;
  },

  async create(payload: CreateBuildPayload): Promise<PCBuildData> {
    const res = await api.post<ApiResponse<PCBuildData>>('/v1/pc-builds', payload);
    return res.data.data;
  },

  async update(id: string, payload: Partial<CreateBuildPayload>): Promise<PCBuildData> {
    const res = await api.put<ApiResponse<PCBuildData>>(`/v1/pc-builds/${id}`, payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/pc-builds/${id}`);
  },

  async submitForReview(id: string): Promise<PCBuildData> {
    const res = await api.post<ApiResponse<PCBuildData>>(`/v1/pc-builds/${id}/submit-review`);
    return res.data.data;
  },

  async updateStatus(id: string, status: 'draft' | 'submitted_review' | 'under_review' | 'reviewed' | 'rejected' | 'in_progress' | 'completed', technicianNotes?: string): Promise<PCBuildData> {
    const res = await api.post<ApiResponse<PCBuildData>>(`/v1/pc-builds/${id}/status`, { status, technician_notes: technicianNotes || undefined });
    return res.data.data;
  },
};
