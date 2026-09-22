import api, { ApiResponse, PaginatedData } from './api';
import { DossierOverviewRow, PatientDossier, ReportSchedule, ReportTechnician, SystemReport } from '../types';

/**
 * API client for the system report module.
 *
 *  - Customer: capture / send / list / latest reports + delivery schedule +
 *    the technician list they can choose recipients from.
 *  - Technician: list of customers who sent them reports + full report.
 *  - Admin: overview of every customer's report & schedule.
 */
// The dev backend (php artisan serve) is single-threaded; heavy telemetry
// endpoints can queue behind it. Give dossier calls a generous timeout so a
// capture never fails just because the server was busy sampling the machine.
const DOSSIER_TIMEOUT = 45000;

export const systemReportApi = {
  // --- Customer ---
  async list(params?: { page?: number; per_page?: number }): Promise<PaginatedData<SystemReport>> {
    const res = await api.get<ApiResponse<PaginatedData<SystemReport>>>('/v1/system-reports', { params, timeout: DOSSIER_TIMEOUT });
    return res.data.data;
  },

  async capture(): Promise<SystemReport> {
    const res = await api.post<ApiResponse<SystemReport>>('/v1/system-reports/capture', null, { timeout: DOSSIER_TIMEOUT });
    return res.data.data;
  },

  async technicians(): Promise<ReportTechnician[]> {
    const res = await api.get<ApiResponse<ReportTechnician[]>>('/v1/system-reports/technicians', { timeout: DOSSIER_TIMEOUT });
    return res.data.data;
  },

  async send(technicianIds: string[]): Promise<SystemReport> {
    const res = await api.post<ApiResponse<SystemReport>>('/v1/system-reports/send', { technician_ids: technicianIds }, { timeout: DOSSIER_TIMEOUT });
    return res.data.data;
  },

  async latest(): Promise<SystemReport> {
    const res = await api.get<ApiResponse<SystemReport>>('/v1/system-reports/latest', { timeout: DOSSIER_TIMEOUT });
    return res.data.data;
  },

  async getSchedule(): Promise<ReportSchedule> {
    const res = await api.get<ApiResponse<ReportSchedule>>('/v1/system-reports/schedule', { timeout: DOSSIER_TIMEOUT });
    return res.data.data;
  },

  async updateSchedule(frequency: 'off' | 'daily' | 'weekly' | 'monthly'): Promise<ReportSchedule> {
    const res = await api.put<ApiResponse<ReportSchedule>>('/v1/system-reports/schedule', { frequency }, { timeout: DOSSIER_TIMEOUT });
    return res.data.data;
  },

  // --- Technician ---
  async technicianPatients(): Promise<PatientDossier[]> {
    const res = await api.get<ApiResponse<PatientDossier[]>>('/v1/technician/system-reports', { timeout: DOSSIER_TIMEOUT });
    return res.data.data;
  },

  async technicianShow(id: string): Promise<SystemReport> {
    const res = await api.get<ApiResponse<SystemReport>>(`/v1/technician/system-reports/${id}`, { timeout: DOSSIER_TIMEOUT });
    return res.data.data;
  },

  // --- Admin ---
  async adminOverview(): Promise<DossierOverviewRow[]> {
    const res = await api.get<ApiResponse<DossierOverviewRow[]>>('/v1/admin/system-reports', { timeout: DOSSIER_TIMEOUT });
    return res.data.data;
  },
};
