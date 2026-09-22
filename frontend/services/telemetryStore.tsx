import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import api from './api';

// ============================================================================
// TYPES — Exact same shapes the monitoring components currently consume
// ============================================================================

export interface SystemHealthData {
  cpu: number;
  ram: { usedPercent: number; freeMB: number; totalMB: number };
  disk: { usedPercent: number; freeGB: number; totalGB: number };
  uptime: string;
  backendStatus: string;
  databaseStatus: string;
  serverTime: string;
  phpVersion: string;
  laravelVersion: string;
}

export interface PerfData {
  cpu: number;
  ram: { usedPercent: number; freeMB: number; totalMB: number };
  disk: { usedPercent: number; freeGB: number; totalGB: number };
  performanceScore: number;
  performanceHealth: string;
}

export interface ProcData {
  name: string;
  pid: number;
  ramMB: number;
  threads: number;
  status: string;
  impact: string;
}

export interface PerfCombined {
  perf: PerfData;
  procs: ProcData[];
  totalProcesses: number;
}

export interface Adapter {
  name: string;
  status: string;
  ipv4: string;
  ipv6: string;
  subnet: string;
  gateway: string;
  dns: string;
  mac: string;
  dhcp: boolean;
  description: string;
}

export interface NetStats {
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  errors: number;
}

export interface NetworkData {
  adapters: Adapter[];
  activeAdapter: Adapter | null;
  latency: number;
  dnsLatency: number;
  netStats: NetStats;
  connectionQuality: string;
  gateway: string;
  dns: string;
  internetReachable: boolean;
  collectionDurationMs: number;
}

export interface DriveData {
  deviceId: string;
  volumeName: string;
  fileSystem: string;
  totalGB: number;
  freeGB: number;
  usedGB: number;
  usedPercent: number;
  health: string;
  driveType: string;
  isSystem: boolean;
  readWrite: boolean;
  mounted: boolean;
}

export interface FileStats {
  totalFiles: number;
  totalFolders: number;
  totalSizeGB: number;
  averageFileSizeMB: number;
  scanDurationMs: number;
  scannedPath: string;
}

export interface StorageCombined {
  drives: DriveData[];
  fileStats: FileStats;
}

export interface HardwareData {
  cpu: { name: string; cores: number; threads: number; maxClockMHz: number; currentClockMHz: number };
  gpu: { name: string; vramMB: number; driverVersion: string; driverDate: string; status: string };
  bios: { manufacturer: string; version: string; date: string };
  motherboard: { manufacturer: string; model: string; serial: string };
  os: { name: string; build: string; architecture: string; version: string };
  storage: { model: string; manufacturer: string; capacityGB: number; interface: string; status: string };
  ram: { totalGB: number; sticks: Array<{ capacityGB: number; speedMHz: number; manufacturer: string; slot: string; type: string }> };
  network: { name: string; manufacturer: string; driverVersion: string };
  system: { manufacturer: string; model: string; totalRam: string };
  allGpus: Array<{ name: string; vramMB: number; driverVersion: string; driverDate: string; status: string }>;
  allStorage: Array<{ model: string; manufacturer: string; capacityGB: number; interface: string; status: string }>;
  hardwareHealth: string;
  hardwareScore: number;
  scanDurationMs: number;
}

export interface SecurityCheck {
  name: string;
  status: string;
}

export interface StabilityEvent {
  id: string;
  label: string;
  details: string;
  timestamp: number;
  type: 'rose' | 'amber';
}

export interface SecurityData {
  integrity: SecurityCheck[];
  events: StabilityEvent[];
  score: number;
}

export interface AnalyticsData {
  summary: {
    totalUsers: number; totalTechnicians: number; totalAdmins: number; totalRepairs: number;
    completedRepairs: number; activeRepairs: number; totalGigs: number; totalBuilds: number;
    totalLifecycleEvents: number; totalCompletionReports: number; performanceScore: number;
    cpu: number; ramPercent: number; diskPercent: number; uptime: string; dbStatus: string;
    apiStatus: string; securityScore: number; lastScan: string; serverTime: string;
    laravelVersion: string; phpVersion: string; queryCount: string;
  };
  timeline: Array<{
    source: string; message: string; details?: string; actor?: string;
    timestamp: string; type: 'info' | 'warn' | 'success' | 'error';
  }>;
  security: {
    score: number; defenderEnabled: boolean;
    firewallProfiles: Array<{ profile: string; state: string }>;
    services: Array<{ name: string; status: string }>;
    events: Array<{ type: string; message: string; timestamp: string }>;
    lastScan: string;
  };
  performance: {
    score: number; cpu: number; ramPercent: number; ramFreeMB: number; ramTotalMB: number;
    diskPercent: number; diskFreeGB: number; diskTotalGB: number; uptime: string; serverTime: string;
  };
  repairs: {
    total: number; completed: number; cancelled: number; active: number;
    byStatus: Record<string, number>; byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    recentRepairs: Array<{
      id: string; customer: string; technician: string; issueCategory: string;
      status: string; severity: string; createdAt: string;
    }>;
    avgCompletionTime: number; totalRevenue: number;
  };
  database: {
    connected: boolean; driver: string; tableCounts: Record<string, number>;
    totalRecords: number; dbSizeKB: number;
  };
  api: {
    status: string; totalUsers: number; totalTokens: number; activeTokens: number;
    phpVersion: string; laravelVersion: string; serverTime: string;
  };
  auditLogs: Array<{
    id: string; type: string; message: string; details: string;
    timestamp: string; source: string;
  }>;
  collectionDurationMs: number;
}

// ============================================================================
// DEFAULTS — Used only before the first successful fetch
// ============================================================================

export const DEFAULT_HEALTH: SystemHealthData = {
  cpu: 0, ram: { usedPercent: 0, freeMB: 0, totalMB: 0 },
  disk: { usedPercent: 0, freeGB: 0, totalGB: 0 },
  uptime: '', backendStatus: 'Connecting...', databaseStatus: '',
  serverTime: '', phpVersion: '', laravelVersion: '',
};

export const DEFAULT_PERF: PerfCombined = {
  perf: { cpu: 0, ram: { usedPercent: 0, freeMB: 0, totalMB: 0 }, disk: { usedPercent: 0, freeGB: 0, totalGB: 0 }, performanceScore: 0, performanceHealth: '' },
  procs: [], totalProcesses: 0,
};

export const DEFAULT_NETWORK: NetworkData = {
  adapters: [], activeAdapter: null, latency: 0, dnsLatency: 0,
  netStats: { bytesReceived: 0, bytesSent: 0, packetsReceived: 0, packetsSent: 0, errors: 0 },
  connectionQuality: '', gateway: '', dns: '', internetReachable: false, collectionDurationMs: 0,
};

export const DEFAULT_STORAGE: StorageCombined = {
  drives: [], fileStats: { totalFiles: 0, totalFolders: 0, totalSizeGB: 0, averageFileSizeMB: 0, scanDurationMs: 0, scannedPath: '' },
};

export const DEFAULT_HARDWARE: HardwareData = {
  cpu: { name: '', cores: 0, threads: 0, maxClockMHz: 0, currentClockMHz: 0 },
  gpu: { name: '', vramMB: 0, driverVersion: '', driverDate: '', status: '' },
  bios: { manufacturer: '', version: '', date: '' },
  motherboard: { manufacturer: '', model: '', serial: '' },
  os: { name: '', build: '', architecture: '', version: '' },
  storage: { model: '', manufacturer: '', capacityGB: 0, interface: '', status: '' },
  ram: { totalGB: 0, sticks: [] },
  network: { name: '', manufacturer: '', driverVersion: '' },
  system: { manufacturer: '', model: '', totalRam: '' },
  allGpus: [],
  allStorage: [],
  hardwareHealth: '', hardwareScore: 0, scanDurationMs: 0,
};

export const DEFAULT_SECURITY: SecurityData = {
  integrity: [], events: [], score: 0,
};

export const DEFAULT_ANALYTICS: AnalyticsData = {
  summary: { totalUsers: 0, totalTechnicians: 0, totalAdmins: 0, totalRepairs: 0, completedRepairs: 0, activeRepairs: 0, totalGigs: 0, totalBuilds: 0, totalLifecycleEvents: 0, totalCompletionReports: 0, performanceScore: 0, cpu: 0, ramPercent: 0, diskPercent: 0, uptime: '', dbStatus: '', apiStatus: '', securityScore: 0, lastScan: '', serverTime: '', laravelVersion: '', phpVersion: '', queryCount: '' },
  timeline: [], security: { score: 0, defenderEnabled: false, firewallProfiles: [], services: [], events: [], lastScan: '' },
  performance: { score: 0, cpu: 0, ramPercent: 0, ramFreeMB: 0, ramTotalMB: 0, diskPercent: 0, diskFreeGB: 0, diskTotalGB: 0, uptime: '', serverTime: '' },
  repairs: { total: 0, completed: 0, cancelled: 0, active: 0, byStatus: {}, byCategory: {}, bySeverity: {}, recentRepairs: [], avgCompletionTime: 0, totalRevenue: 0 },
  database: { connected: false, driver: '', tableCounts: {}, totalRecords: 0, dbSizeKB: 0 },
  api: { status: '', totalUsers: 0, totalTokens: 0, activeTokens: 0, phpVersion: '', laravelVersion: '', serverTime: '' },
  auditLogs: [], collectionDurationMs: 0,
};

// ============================================================================
// HISTORY — Sliding window for chart data (capped at 20 entries)
// ============================================================================

export interface HistoryEntry {
  time: string;
  cpu: number;
  ram: number;
  bytesReceived: number;
}

// ============================================================================
// STORE STATE
// ============================================================================

export interface TelemetryState {
  health: SystemHealthData;
  performance: PerfCombined;
  network: NetworkData;
  storage: StorageCombined;
  hardware: HardwareData;
  security: SecurityData;
  analytics: AnalyticsData;
  history: HistoryEntry[];
  lastUpdated: number;
  isRefreshing: boolean;
  isInitialized: boolean;
}

const MAX_HISTORY = 20;

// ============================================================================
// CONTEXT
// ============================================================================

interface TelemetryContextType {
  state: TelemetryState;
  refreshNow: () => void;
}

const TelemetryContext = createContext<TelemetryContextType>({
  state: {
    health: DEFAULT_HEALTH, performance: DEFAULT_PERF, network: DEFAULT_NETWORK,
    storage: DEFAULT_STORAGE, hardware: DEFAULT_HARDWARE, security: DEFAULT_SECURITY,
    analytics: DEFAULT_ANALYTICS, history: [], lastUpdated: 0, isRefreshing: false, isInitialized: false,
  },
  refreshNow: () => {},
});

export const useTelemetry = () => useContext(TelemetryContext);

// ============================================================================
// FETCHERS — Each returns null on failure (never throws)
// ============================================================================

async function fetchHealth(): Promise<SystemHealthData | null> {
  try {
    const res = await api.get<any>('/v1/system/health');
    const d = res.data?.data;
    return d ? { ...d, backendStatus: 'Online' } : null;
  } catch { return null; }
}

async function fetchPerformance(): Promise<PerfCombined | null> {
  try {
    const [perfRes, procRes] = await Promise.all([
      api.get<any>('/v1/system/performance'),
      api.get<any>('/v1/system/processes'),
    ]);
    return {
      perf: perfRes.data.data,
      procs: procRes.data.data.processes,
      totalProcesses: procRes.data.data.totalProcesses,
    };
  } catch { return null; }
}

async function fetchNetwork(): Promise<NetworkData | null> {
  try {
    const res = await api.get<any>('/v1/system/network');
    return res.data.data as NetworkData;
  } catch { return null; }
}

async function fetchStorage(): Promise<StorageCombined | null> {
  try {
    const [driveRes, statsRes] = await Promise.all([
      api.get<any>('/v1/system/drives'),
      api.get<any>('/v1/system/file-stats'),
    ]);
    return { drives: driveRes.data.data.drives, fileStats: statsRes.data.data };
  } catch { return null; }
}

async function fetchHardware(): Promise<HardwareData | null> {
  try {
    const res = await api.get<any>('/v1/system/hardware');
    return res.data.data;
  } catch { return null; }
}

async function fetchAnalytics(): Promise<AnalyticsData | null> {
  try {
    const res = await api.get<any>('/v1/reports/analytics');
    return res.data.data;
  } catch { return null; }
}

/**
 * Security data is derived from the analytics payload, so the heavy
 * /v1/reports/analytics endpoint is fetched ONCE per cycle instead of twice.
 */
function deriveSecurity(analytics: AnalyticsData | null): SecurityData | null {
  const sec = analytics?.security;
  if (!sec) return null;

  const integrity: SecurityCheck[] = [
    { name: 'Windows Defender', status: sec.defenderEnabled ? 'Active' : 'Inactive' },
    ...sec.firewallProfiles.map((fw: any) => ({ name: `${fw.profile} Firewall`, status: fw.state === 'ON' ? 'Enabled' : 'Disabled' })),
    ...sec.services.map((svc: any) => ({ name: svc.name, status: svc.status })),
  ];
  const events: StabilityEvent[] = sec.events.map((evt: any, i: number) => ({
    id: `sec-${i}`, label: evt.type || 'System Event', details: evt.message || 'No details',
    timestamp: Date.now(), type: evt.type === 'error' ? 'rose' as const : 'amber' as const,
  }));

  return { integrity, events, score: sec.score };
}

// ============================================================================
// PROVIDER
// ============================================================================

// ============================================================================
// POLLING CADENCE
// ============================================================================
// The light telemetry endpoints just read the monitor snapshot file and are
// cheap, so they refresh every LIGHT_POLL_MS. The /v1/reports/analytics
// endpoint runs ~30 database queries per call, so it is only fetched once
// per ANALYTICS_POLL_MS. Previously EVERYTHING (including analytics) was
// fetched every 5 seconds, which flooded the single-threaded PHP dev server
// with ~8 concurrent requests and made every other click queue behind them
// ("sometimes we get delays").
const LIGHT_POLL_MS = 15000;
const ANALYTICS_POLL_MS = 60000;

export const TelemetryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TelemetryState>({
    health: DEFAULT_HEALTH, performance: DEFAULT_PERF, network: DEFAULT_NETWORK,
    storage: DEFAULT_STORAGE, hardware: DEFAULT_HARDWARE, security: DEFAULT_SECURITY,
    analytics: DEFAULT_ANALYTICS, history: [], lastUpdated: 0, isRefreshing: false, isInitialized: false,
  });

  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);
  const busyRef = useRef(false);
  const lastAnalyticsAtRef = useRef(0);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const doFetch = useCallback(async () => {
    if (!mountedRef.current || busyRef.current) return;
    busyRef.current = true;

    setState(s => ({ ...s, isRefreshing: true }));

    try {
      const now = Date.now();
      const fetchAnalyticsNow = now - lastAnalyticsAtRef.current >= ANALYTICS_POLL_MS;
      if (fetchAnalyticsNow) lastAnalyticsAtRef.current = now;

      const [health, performance, network, storage, hardware, analytics] = await Promise.all([
        fetchHealth(), fetchPerformance(), fetchNetwork(), fetchStorage(),
        fetchHardware(), fetchAnalyticsNow ? fetchAnalytics() : Promise.resolve(null),
      ]);
      const security = deriveSecurity(analytics);

      if (!mountedRef.current) return;

      setState(prev => {
        const h = health ?? prev.health;
        const p = performance ?? prev.performance;
        const n = network ?? prev.network;

        const newHistory = [...prev.history, {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: h.cpu, ram: h.ram.usedPercent,
          bytesReceived: n.netStats.bytesReceived,
        }].slice(-MAX_HISTORY);

        return {
          health: h,
          performance: p,
          network: n,
          storage: storage ?? prev.storage,
          hardware: hardware ?? prev.hardware,
          security: security ?? prev.security,
          analytics: analytics ?? prev.analytics,
          history: newHistory,
          lastUpdated: Date.now(),
          isRefreshing: false,
          isInitialized: true,
        };
      });
    } finally {
      busyRef.current = false;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;

    const tick = async () => {
      if (!activeRef.current || !mountedRef.current) return;
      await doFetch();
      if (activeRef.current && mountedRef.current) {
        timerRef.current = setTimeout(tick, LIGHT_POLL_MS);
      }
    };
    tick();
  }, [doFetch]);

  const stopPolling = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const refreshNow = useCallback(() => {
    doFetch();
  }, [doFetch]);

  // Expose start/stop on window for AuthProvider to call
  useEffect(() => {
    (window as any).__telemetryStart = startPolling;
    (window as any).__telemetryStop = stopPolling;
    return () => {
      delete (window as any).__telemetryStart;
      delete (window as any).__telemetryStop;
    };
  }, [startPolling, stopPolling]);

  return (
    <TelemetryContext.Provider value={{ state, refreshNow }}>
      {children}
    </TelemetryContext.Provider>
  );
};
