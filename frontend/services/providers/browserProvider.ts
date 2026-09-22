import { SystemStats, ProcessInfo, StorageReport } from '../../types';
import { DiagnosticProvider } from './baseProvider';

/**
 * Browser-native diagnostic provider.
 * Uses browser APIs (navigator, performance) for system stats.
 * No external dependencies.
 */
export class BrowserDiagnosticProvider implements DiagnosticProvider {
  async getSystemStats(): Promise<SystemStats> {
    const nav = navigator as any;
    return {
      cpu: 0,
      ram: nav.deviceMemory ? (nav.deviceMemory * 1024) : 0,
      disk: 0,
      temp: 0,
      networkDown: 0,
      networkUp: 0,
      batteryLevel: undefined,
      isCharging: undefined,
      timestamp: Date.now(),
    };
  }

  async getProcesses(): Promise<ProcessInfo[]> {
    return [];
  }

  async optimizeSystem(): Promise<{ ramRecovered: number; cacheStorePurged: number }> {
    return { ramRecovered: 0, cacheStorePurged: 0 };
  }

  async getHardwareInventory(): Promise<Array<{ name: string; category: string; status: string; version: string }>> {
    return [];
  }

  async getSecurityIntegrity(): Promise<Array<{ name: string; status: string }>> {
    return [];
  }

  async getStabilityEvents(): Promise<Array<{ id: string; label: string; details: string; timestamp: number; type: 'rose' | 'amber' }>> {
    return [];
  }

  async runNetworkLatencyTest(): Promise<number> {
    return 0;
  }

  async getNetworkForensics(): Promise<Array<{ name: string; down: string; up: string; type: string }>> {
    return [];
  }

  async startVolumeScan(): Promise<{ files: StorageReport[]; totalSize: number }> {
    return { files: [], totalSize: 0 };
  }
}
