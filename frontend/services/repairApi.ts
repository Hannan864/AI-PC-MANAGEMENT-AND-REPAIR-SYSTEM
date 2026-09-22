import api, { ApiResponse, PaginatedData } from './api';

export interface RepairRequestData {
  id: string;
  historyId: string;
  userId: string;
  technicianId: string | null;
  gigId: string | null;
  gigTitle: string | null;
  issueCategory: string | null;
  issueDescription: string;
  severityLevel: 'low' | 'medium' | 'high';
  severityScore: number | null;
  status: string;
  systemSpecifications: Record<string, string> | null;
  userImages: string[];
  techImages: string[];
  userName?: string;
  technicianNote?: string | null;
  technicianDecision?: string | null;
  attachedDiagnosticId?: string | null;
  attachedDiagnostics?: { id: string; sourceModule: string; data: any; createdAt: number } | null;
  aiSuggestion?: { recommendedGigId?: string; recommendedTechnicianId?: string; reason?: string } | null;
  userChoice?: { gigId?: string; technicianId?: string } | null;
  isAIOverridden?: boolean;
  lifecycleHistory?: Array<{ status: string; timestamp: number; updatedBy: string; note?: string }>;
  sla?: {
    createdAt: number;
    acceptedAt?: number;
    estimatedStartTime?: number;
    estimatedCompletionTime?: number;
    actualCompletionTime?: number;
  };
  technicianNotes?: Array<{ timestamp: number; note: string; author: string }>;
  user?: { id: string; name: string; email: string; role: string };
  technician?: { id: string; name: string; email: string; role: string };
  lifecycleEvents?: LifecycleEventData[];
  completionReport?: CompletionReportData | null;
  createdAt: string;
  updatedAt: string;
}

export interface LifecycleEventData {
  id: number;
  repairRequestId: string;
  status: string;
  updatedBy: string;
  actor?: { id: string; name: string; email: string };
  note: string | null;
  createdAt: string;
}

export interface CompletionReportData {
  id: string;
  repairRequestId: string;
  issueSummary: string;
  rootCause: string;
  partsReplaced: Array<{ name: string; cost: number; qty?: number }>;
  laborCost: number;
  totalCost: number;
  workNotes: string | null;
  timeSpentMinutes: number;
  createdAt: string;
}

export interface SLAData {
  opened_at: string;
  assigned_at: string | null;
  in_progress_at: string | null;
  completed_at: string | null;
  minutes_to_assign: number | null;
  minutes_to_start: number | null;
  repair_duration_minutes: number | null;
  total_duration_minutes: number | null;
  timeline: Array<{
    status: string;
    actor: string | null;
    note: string | null;
    timestamp: string;
  }>;
}

export interface CreateRepairPayload {
  gig_title?: string;
  issue_category?: string;
  issue_description: string;
  severity_level?: 'low' | 'medium' | 'high';
  system_specifications?: Record<string, string>;
  user_images?: File[];
}

export const repairApi = {
  async getUnassigned(params?: {
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedData<RepairRequestData>> {
    const res = await api.get<ApiResponse<PaginatedData<RepairRequestData>>>('/v1/repair-requests/unassigned', { params });
    return res.data.data;
  },

  async list(params?: {
    status?: string;
    severity_level?: string;
    search?: string;
    sort?: string;
    direction?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedData<RepairRequestData>> {
    const res = await api.get<ApiResponse<PaginatedData<RepairRequestData>>>('/v1/repair-requests', { params });
    return res.data.data;
  },

  async get(id: string): Promise<{ request: RepairRequestData; sla: SLAData }> {
    const res = await api.get<ApiResponse<{ request: RepairRequestData; sla: SLAData }>>(`/v1/repair-requests/${id}`);
    return res.data.data;
  },

  async create(payload: CreateRepairPayload): Promise<RepairRequestData> {
    const formData = new FormData();
    
    // Ensure issue_description is trimmed and at least 10 characters
    const description = payload.issue_description?.trim() || '';
    if (description.length < 10) {
      throw new Error('Issue description must be at least 10 characters long.');
    }
    formData.append('issue_description', description);
    
    if (payload.gig_title) formData.append('gig_title', payload.gig_title);
    if (payload.issue_category) formData.append('issue_category', payload.issue_category);
    if (payload.severity_level) formData.append('severity_level', payload.severity_level);
    if (payload.system_specifications) {
      formData.append('system_specifications', JSON.stringify(payload.system_specifications));
    }
    if (payload.user_images && payload.user_images.length > 0) {
      payload.user_images.forEach((file) => {
        if (file instanceof File) {
          formData.append('user_images[]', file);
        }
      });
    }
    const res = await api.post<ApiResponse<RepairRequestData>>('/v1/repair-requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/repair-requests/${id}`);
  },

  async assign(id: string, technicianId: string, note?: string): Promise<RepairRequestData> {
    const res = await api.post<ApiResponse<RepairRequestData>>(`/v1/repair-requests/${id}/assign`, {
      technician_id: technicianId,
      note,
    });
    return res.data.data;
  },

  async updateStatus(id: string, status: string, note?: string, severityLevel?: 'low' | 'medium' | 'high'): Promise<RepairRequestData> {
    const res = await api.post<ApiResponse<RepairRequestData>>(`/v1/repair-requests/${id}/status`, {
      status,
      note,
      ...(severityLevel ? { severity_level: severityLevel } : {}),
    });
    return res.data.data;
  },

  async complete(id: string, payload: {
    issue_summary: string;
    root_cause: string;
    parts_replaced?: Array<{ name: string; cost: number; qty?: number }>;
    labor_cost: number;
    work_notes?: string;
    time_spent_minutes: number;
    completion_images?: File[];
  }): Promise<RepairRequestData> {
    const formData = new FormData();
    formData.append('issue_summary', payload.issue_summary);
    formData.append('root_cause', payload.root_cause);
    formData.append('labor_cost', String(payload.labor_cost));
    formData.append('time_spent_minutes', String(payload.time_spent_minutes));
    if (payload.work_notes) formData.append('work_notes', payload.work_notes);
    if (payload.parts_replaced) {
      payload.parts_replaced.forEach((part, i) => {
        formData.append(`parts_replaced[${i}][name]`, part.name);
        formData.append(`parts_replaced[${i}][cost]`, String(part.cost));
        if (part.qty) formData.append(`parts_replaced[${i}][qty]`, String(part.qty));
      });
    }
    if (payload.completion_images) {
      payload.completion_images.forEach((file) => formData.append('completion_images[]', file));
    }
    const res = await api.post<ApiResponse<RepairRequestData>>(`/v1/repair-requests/${id}/complete`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async getTimeline(id: string): Promise<SLAData> {
    const res = await api.get<ApiResponse<SLAData>>(`/v1/repair-requests/${id}/timeline`);
    return res.data.data;
  },

  async getServiceHistory(params?: { page?: number; per_page?: number }): Promise<PaginatedData<RepairRequestData>> {
    const res = await api.get<ApiResponse<PaginatedData<RepairRequestData>>>('/v1/user/service-history', { params });
    return res.data.data;
  },

  async getTechnicianHistory(params?: { page?: number; per_page?: number }): Promise<PaginatedData<RepairRequestData>> {
    const res = await api.get<ApiResponse<PaginatedData<RepairRequestData>>>('/v1/technician/service-history', { params });
    return res.data.data;
  },
};
