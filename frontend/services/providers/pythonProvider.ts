import { SystemStats, ProcessInfo, StorageReport } from '../../types';
import { DiagnosticProvider } from './baseProvider';

export interface PythonHealthResponse {
  cpu: number;
  ram: number;
  disk: number;
  temp: number;
  networkDown: number;
  networkUp: number;
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface PythonPerformanceResponse {
  processes: Array<{
    id: number;
    name: string;
    cpu: number;
    ram: number;
    impact: 'High' | 'Medium' | 'Low';
    status: 'Active' | 'Background' | 'Suspended';
  }>;
}

export interface PythonStorageResponse {
  files: Array<{
    path: string;
    size: number;
    lastModified: number;
    isLarge: boolean;
  }>;
  totalSize: number;
}

export interface PythonNetworkResponse {
  latency: number;
  forensics: Array<{
    name: string;
    down: string;
    up: string;
    type: string;
  }>;
}

export interface PythonHardwareResponse {
  inventory: Array<{
    name: string;
    category: string;
    status: string;
    version: string;
  }>;
}

export interface PythonSecurityResponse {
  integrity: Array<{ name: string; status: string }>;
  events: Array<{ id: string; label: string; details: string; timestamp: number; type: 'rose' | 'amber' }>;
}

export class PythonApiAdapter {
  private get baseUrl(): string {
    const version = (typeof window !== 'undefined' ? localStorage.getItem('settings.apiVersion') : 'v1') || 'v1';
    return `http://localhost:5000/api/${version}`;
  }

  async getHealth(): Promise<PythonHealthResponse> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new Error(`Python API response HTTP ${res.status}`);
    return await res.json();
  }

  async getPerformance(): Promise<PythonPerformanceResponse> {
    const res = await fetch(`${this.baseUrl}/performance`);
    if (!res.ok) throw new Error(`Python API response HTTP ${res.status}`);
    return await res.json();
  }

  async getStorage(): Promise<PythonStorageResponse> {
    const res = await fetch(`${this.baseUrl}/storage`);
    if (!res.ok) throw new Error(`Python API response HTTP ${res.status}`);
    return await res.json();
  }

  async getNetwork(): Promise<PythonNetworkResponse> {
    const res = await fetch(`${this.baseUrl}/network`);
    if (!res.ok) throw new Error(`Python API response HTTP ${res.status}`);
    return await res.json();
  }

  async getHardware(): Promise<PythonHardwareResponse> {
    const res = await fetch(`${this.baseUrl}/hardware`);
    if (!res.ok) throw new Error(`Python API response HTTP ${res.status}`);
    return await res.json();
  }

  async getSecurity(): Promise<PythonSecurityResponse> {
    const res = await fetch(`${this.baseUrl}/security`);
    if (!res.ok) throw new Error(`Python API response HTTP ${res.status}`);
    return await res.json();
  }
}

/**
 * PYTHON DIAGNOSTIC PROVIDER
 * Custom provider implementation using the python endpoints client.
 */
export class PythonDiagnosticProvider implements DiagnosticProvider {
  private adapter = new PythonApiAdapter();

  async getSystemStats(): Promise<SystemStats> {
    const stats = await this.adapter.getHealth();
    return {
      cpu: stats.cpu,
      ram: stats.ram,
      disk: stats.disk,
      temp: stats.temp,
      networkDown: stats.networkDown,
      networkUp: stats.networkUp,
      batteryLevel: stats.batteryLevel,
      isCharging: stats.isCharging,
      timestamp: Date.now()
    };
  }

  async getProcesses(): Promise<ProcessInfo[]> {
    const data = await this.adapter.getPerformance();
    return data.processes;
  }

  async optimizeSystem(currentProcesses: ProcessInfo[]): Promise<{ ramRecovered: number; cacheStorePurged: number }> {
    const version = (typeof window !== 'undefined' ? localStorage.getItem('settings.apiVersion') : 'v1') || 'v1';
    const res = await fetch(`http://localhost:5000/api/${version}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentProcesses })
    });
    if (!res.ok) throw new Error('Failed to run optimize on Python service');
    return await res.json();
  }

  async getHardwareInventory(): Promise<Array<{ name: string; category: string; status: string; version: string }>> {
    const data = await this.adapter.getHardware();
    return data.inventory;
  }

  async getSecurityIntegrity(): Promise<Array<{ name: string; status: string }>> {
    const data = await this.adapter.getSecurity();
    return data.integrity;
  }

  async getStabilityEvents(): Promise<Array<{ id: string; label: string; details: string; timestamp: number; type: 'rose' | 'amber' }>> {
    const data = await this.adapter.getSecurity();
    return data.events;
  }

  async runNetworkLatencyTest(target = 'https://www.google.com/favicon.ico'): Promise<number> {
    const data = await this.adapter.getNetwork();
    return data.latency;
  }

  async getNetworkForensics(): Promise<Array<{ name: string; down: string; up: string; type: string }>> {
    const data = await this.adapter.getNetwork();
    return data.forensics;
  }

  async startVolumeScan(dirHandleName: string): Promise<{ files: StorageReport[]; totalSize: number }> {
    const data = await this.adapter.getStorage();
    return {
      files: data.files,
      totalSize: data.totalSize
    };
  }
}
