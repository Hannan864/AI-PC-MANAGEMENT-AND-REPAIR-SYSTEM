import api, { ApiResponse, PaginatedData } from './api';

export interface AdminUserData {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'technician' | 'admin';
  status: string;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalTechnicians: number;
  activeTechnicians: number;
  totalAdmins: number;
}

export interface AdminReport {
  total_requests: number;
  completed_requests: number;
  cancelled_requests: number;
  active_requests: number;
  avg_completion_minutes: number | null;
  total_revenue: number;
  total_labor_cost: number;
  requests_by_category: Record<string, number>;
  requests_by_severity: Record<string, number>;
  requests_by_status: Record<string, number>;
}

export interface AITriageResult {
  severitySuggestion: string;
  categorySuggestion: string;
  priorityScore: number;
  analysisNotes: string;
  isAiGenerated: boolean;
  driverUsed: string;
}

export const adminApi = {
  async listUsers(params?: { page?: number; per_page?: number }): Promise<PaginatedData<AdminUserData>> {
    const res = await api.get<ApiResponse<AdminUserData[]>>('/v1/admin/users', { params });
    const items = Array.isArray(res.data.data) ? res.data.data : [];
    return { data: items, meta: { total: items.length, page: 1, perPage: items.length, lastPage: 1 } };
  },

  async updateUserStatus(id: string, status: 'active' | 'suspended'): Promise<AdminUserData> {
    const res = await api.put<ApiResponse<AdminUserData>>(`/v1/admin/users/${id}/status`, { status });
    return res.data.data;
  },

  async listTechnicians(): Promise<AdminUserData[]> {
    const res = await api.get<ApiResponse<AdminUserData[]>>('/v1/admin/technicians');
    return res.data.data;
  },

  async getDashboard(): Promise<DashboardStats> {
    const res = await api.get<ApiResponse<DashboardStats>>('/v1/admin/dashboard');
    return res.data.data;
  },

  async getReport(): Promise<AdminReport> {
    const res = await api.get<ApiResponse<AdminReport>>('/v1/admin/reports/summary');
    return res.data.data;
  },

  async runAITriage(payload: {
    issue_description: string;
    system_specifications?: Record<string, string>;
    severity_level?: string;
  }): Promise<AITriageResult> {
    const res = await api.post<ApiResponse<AITriageResult>>('/v1/ai/triage', payload);
    return res.data.data;
  },
};
