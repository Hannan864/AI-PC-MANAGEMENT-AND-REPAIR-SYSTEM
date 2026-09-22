
export enum Role {
  USER = 'USER',
  TECHNICIAN = 'TECHNICIAN',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  email: string;
  passwordHash?: string; // Basic offline hash replication (optional for API responses)
  name: string;
  role: Role;
  createdAt: number;
  updatedAt?: number;
  status?: 'ACTIVE' | 'SUSPENDED';
  profileImage?: string | null;
}

export interface Technician extends User {
  specialty?: string;
}

export interface Session {
  id: string;
  userId: string;
  role: Role;
  createdAt: number;
  expiresAt: number;
}

export enum GigCategory {
  HARDWARE = 'Hardware',
  SOFTWARE = 'Software',
  NETWORK = 'Network',
  FULL_REPAIR = 'Full Repair'
}

export interface Gig {
  id: string;
  technicianId: string;
  technicianName: string;
  title: string;
  description: string;
  category: GigCategory;
  price: number;
  estimatedTime: string;
  isAvailable: boolean;
  createdAt: number;
}

export enum RepairRequestStatus {
  SUBMITTED = 'SUBMITTED',
  AI_TRIAGED = 'AI_TRIAGED',
  GIG_SELECTED = 'GIG_SELECTED',
  TECHNICIAN_ASSIGNED = 'TECHNICIAN_ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_PARTS = 'WAITING_PARTS',
  TESTING = 'TESTING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  INFO_REQUESTED = 'INFO_REQUESTED',
  PROPOSED_ALTERNATIVE = 'PROPOSED_ALTERNATIVE'
}

export interface LifecycleEvent {
  status: RepairRequestStatus;
  timestamp: number;
  updatedBy: 'USER' | 'TECHNICIAN' | 'SYSTEM';
  note?: string;
}

export interface SLAData {
  createdAt: number;
  acceptedAt?: number;
  estimatedStartTime?: number;
  estimatedCompletionTime?: number;
  actualCompletionTime?: number;
}


export interface DiagnosticSnapshot {
  id: string;
  sourceModule: string;
  data: any;
  createdAt: number;
}

export interface PartUsed {
  name: string;
  price: number;
  quantity: number;
}

export interface ServiceCompletionReport {
  issueSummary: string;
  rootCauseAnalysis: string;
  partsReplaced: PartUsed[];
  laborCost: number;
  totalCost: number;
  workNotes: string;
  timeSpentMinutes: number;
  completedAt: number;
}

export interface RepairRequest {
  id: string;
  userId: string;
  userName: string;
  technicianId?: string;
  technician?: { id: string; name: string; email: string; role: string };
  gigId?: string;
  gigTitle?: string;
  issueCategory?: string;
  issueDescription: string;
  attachedDiagnosticId?: string;
  attachedDiagnostics?: DiagnosticSnapshot;
  severityScore?: number;
  severityLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Human-in-the-loop fields
  aiSuggestion?: {
    recommendedGigId?: string;
    recommendedTechnicianId?: string;
    reason?: string;
  };
  userChoice?: {
    gigId?: string;
    technicianId?: string;
  };
  isAIOverridden?: boolean;
  technicianDecision?: string;
  technicianNote?: string;
  
  status: RepairRequestStatus;
  lifecycleHistory?: LifecycleEvent[];
  sla?: SLAData;
  technicianNotes?: { timestamp: number; note: string; author: string }[];

  userImages?: string[]; // base64 visual proofs uploaded by customer
  techImages?: string[]; // base64 visual proofs uploaded by technician
  completionReport?: ServiceCompletionReport; // structured report filed on complete

  createdAt: number;
  updatedAt: number;
}

export enum UserHistoryType {
  PC_BUILD = 'PC_BUILD',
  REPAIR_REQUEST = 'REPAIR_REQUEST',
  DIAGNOSTIC = 'DIAGNOSTIC'
}

export interface UserHistory {
  historyId: string;
  userId: string;
  type: UserHistoryType;
  referenceId: string;
  title: string;
  summary: string;
  timestamp: number;
}

export enum BuildRequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export interface PCBuild {
  buildId: string;
  userId: string;
  buildName: string;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  powerSupply: string;
  motherboard: string;
  case?: string;
  estimatedCostUSD?: number;
  estimatedCostPKR?: number;
  compatibilityStatus: 'PASS' | 'WARNING' | 'FAIL';
  performanceScore: number;
  issues?: string[];
  bottlenecks?: string[];
  status?: BuildRequestStatus;
  technicianId?: string;
  technicianNotes?: string;
  userNotes?: string;
  createdAt: number;
}

export enum ServiceType {
  HEALTH = 'HEALTH',
  PERFORMANCE = 'PERFORMANCE',
  STORAGE = 'STORAGE',
  STARTUP = 'STARTUP',
  NETWORK = 'NETWORK',
  REPORTS = 'REPORTS',
  ALERTS = 'ALERTS',
  SCHEDULER = 'SCHEDULER',
  HARDWARE = 'HARDWARE',
  SECURITY = 'SECURITY',
  POWER = 'POWER',
  APP_MANAGER = 'APP_MANAGER',
  AUTOMATION = 'AUTOMATION',
  // Auth additions
  ACCOUNT_LOGIN = 'ACCOUNT_LOGIN',
  ACCOUNT_REGISTER = 'ACCOUNT_REGISTER',
  ACCOUNT_PROFILE = 'ACCOUNT_PROFILE',
  DASHBOARD_USER = 'DASHBOARD_USER',
  DASHBOARD_TECH = 'DASHBOARD_TECH',
  DASHBOARD_ADMIN = 'DASHBOARD_ADMIN',
  ADMIN_USERS_MGMT = 'ADMIN_USERS_MGMT',
  ADMIN_TECHS_MGMT = 'ADMIN_TECHS_MGMT',
  ADMIN_REQUESTS_MGMT = 'ADMIN_REQUESTS_MGMT',
  ADMIN_SYSTEM_REPORTS = 'ADMIN_SYSTEM_REPORTS',
  ADMIN_DOSSIERS = 'ADMIN_DOSSIERS',
  
  // PC Medical Dossier (Phase 8)
  SYSTEM_DOSSIER = 'SYSTEM_DOSSIER',
  PATIENT_DOSSIERS = 'PATIENT_DOSSIERS',
  
  // User Service Center
  BROWSE_GIGS = 'BROWSE_GIGS',
  NEW_REQUEST = 'NEW_REQUEST',
  ACTIVE_REQUESTS = 'ACTIVE_REQUESTS',
  SERVICE_HISTORY = 'SERVICE_HISTORY',
  ASSIGNED_TECH = 'ASSIGNED_TECH',
  PC_BUILD_PLANNER = 'PC_BUILD_PLANNER',
  USER_HISTORY = 'USER_HISTORY',
  
  // Tech Repair Center
  GIG_MANAGEMENT = 'GIG_MANAGEMENT',
  INCOMING_REQUESTS = 'INCOMING_REQUESTS',
  INCOMING_BUILD_REQUESTS = 'INCOMING_BUILD_REQUESTS',
  ASSIGNED_JOBS = 'ASSIGNED_JOBS',
  ACTIVE_REPAIRS = 'ACTIVE_REPAIRS',
  COMPLETED_JOBS = 'COMPLETED_JOBS',
  SERVICE_REPORTS = 'SERVICE_REPORTS',
  CUSTOMER_HISTORY = 'CUSTOMER_HISTORY'
}

// ---------------------------------------------------------------------------
// PC MEDICAL DOSSIER (Phase 8) — system reports & delivery schedules
// ---------------------------------------------------------------------------

export type DossierStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';

export interface DossierVitals {
  healthScore: number;
  status: DossierStatus;
  cpuPercent: number | null;
  ramPercent: number | null;
  temperature: number | null;
  diskFreePct: number | null;
  uptime: string | null;
  os: Record<string, any> | null;
  performanceScore: number | null;
  batteryLevel: number | null;
  isCharging: boolean | null;
}

export interface DossierSymptom {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  recommendedAction: string | null;
  detectedAt: string | null;
  status: string | null;
}

export interface DossierRecommendation {
  priority: 'P0' | 'P1' | 'P2';
  title: string;
  details: string;
  action: string | null;
  system: string;
  framing: string;
}

export interface DossierData {
  schemaVersion: string;
  source: string;
  generatedAt: string;
  reportType: string;
  patient: {
    userId: string;
    name: string;
    email: string;
    os: string | Record<string, any> | null;
    systemSummary: string;
    assignedTech: string | null;
  };
  vitals: DossierVitals;
  systems: Record<string, any>;
  symptoms: DossierSymptom[];
  recommendations: DossierRecommendation[];
  history: Array<{ capturedAt: string; healthScore: number }>;
}

export interface SystemReport {
  id: string;
  title: string;
  reportType: string;
  healthScore: number | null;
  source: string;
  data: DossierData;
  createdAt: string;
  technician: { id: string; name: string; email: string } | null;
  technicians: { id: string; name: string; email: string }[] | null;
}

export interface ReportTechnician {
  id: string;
  name: string;
  email: string;
  specialty: string | null;
  rating: number | null;
  isAvailable: boolean | null;
  jobsCompleted: number | null;
}

export interface ReportSchedule {
  frequency: 'off' | 'daily' | 'weekly' | 'monthly' | null;
  enabled: boolean | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  technicianIds: string[] | null;
  technicians: { id: string; name: string; email: string }[] | null;
  updatedAt: string | null;
}

export interface ReportSummary {
  id: string;
  title: string;
  reportType: string;
  healthScore: number | null;
  status: DossierStatus | null;
  createdAt: string;
}

export interface PatientDossier {
  userId: string;
  name: string;
  email: string;
  reportCount: number;
  healthScore: number | null;
  reportStatus: DossierStatus | null;
  lastCaptured: string | null;
  job: {
    id: string;
    gigTitle: string;
    issue: string;
    status: string;
    severity: string;
  } | null;
  latestReport: SystemReport | null;
  /** Every report delivered to this technician, newest first. */
  reports: ReportSummary[];
}

export interface DossierOverviewRow {
  userId: string;
  name: string;
  email: string;
  status: string;
  healthScore: number | null;
  reportStatus: DossierStatus | null;
  lastCaptured: string | null;
  reportCount: number;
  schedule: string;
  scheduleEnabled: boolean;
  nextRunAt: string | null;
  assignedTech: string | null;
}

export interface ServiceMetadata {
  id: ServiceType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface Tab {
  id: string;
  serviceId: ServiceType;
  title: string;
  isLocked?: boolean;
}

export interface SystemStats {
  cpu: number;
  ram: number;
  disk: number;
  temp: number;
  networkDown: number;
  networkUp: number;
  timestamp: number;
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface ProcessInfo {
  id: number;
  name: string;
  cpu: number;
  ram: number;
  impact: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Background' | 'Suspended';
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  service: ServiceType;
  actionable?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  service: ServiceType;
  message: string;
  type: 'info' | 'warn' | 'success' | 'error';
}

export interface StorageReport {
  path: string;
  size: number;
  lastModified: number;
  isLarge: boolean;
}
