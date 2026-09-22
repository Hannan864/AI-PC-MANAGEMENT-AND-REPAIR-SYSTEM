import { SystemStats, ProcessInfo, StorageReport } from '../../types';
import { probe } from '../systemProbe';
import { DiagnosticProvider } from './baseProvider';

/**
 * MOCK COMPONENT IMPLEMENTATION
 * Provides simulated high-fidelity telemetry when selected or acting as a failsafe receiver.
 */
export class MockDiagnosticProvider implements DiagnosticProvider {
  private lastLatency = 24;

  async getSystemStats(): Promise<SystemStats> {
    return await probe.capture();
  }

  async getProcesses(): Promise<ProcessInfo[]> {
    const isHidden = typeof document !== 'undefined' && document.hidden;
    const currentStats = await this.getSystemStats();
    return [
      { id: 1, name: 'System Sentinel UI (Mock)', cpu: Math.max(0.1, parseFloat((currentStats.cpu / 15).toFixed(1))), ram: 64, impact: 'Low', status: isHidden ? 'Background' : 'Active' },
      { id: 2, name: 'Gemini Analysis Engine', cpu: Math.max(0.1, parseFloat((currentStats.cpu / 10).toFixed(1))), ram: 128, impact: 'Medium', status: 'Background' },
      { id: 3, name: 'IndexedDB Persistence', cpu: Math.max(0.01, parseFloat((currentStats.cpu / 50).toFixed(1))), ram: 32, impact: 'Low', status: isHidden ? 'Suspended' : 'Active' },
    ];
  }

  async optimizeSystem(currentProcesses: ProcessInfo[]): Promise<{ ramRecovered: number; cacheStorePurged: number }> {
    let cacheStorePurged = 0;
    try {
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
          cacheStorePurged++;
        }
      }
    } catch (e) {
      console.warn("Secure Web Cache Storage is unavailable for purging in this sandbox environment", e);
    }

    const ramRecovered = Math.floor(Math.random() * 450) + 120;
    return { ramRecovered, cacheStorePurged };
  }

  async getHardwareInventory(): Promise<Array<{ name: string; category: string; status: string; version: string }>> {
    return [
      { name: 'NVIDIA GeForce RTX 4080 (Mock)', category: 'GPU', status: 'Optimal', version: '546.17' },
      { name: 'AMD Ryzen 9 7950X (Mock)', category: 'CPU', status: 'Healthy', version: '1.4.0.0' },
      { name: 'Intel(R) Wi-Fi 6E AX211 (Mock)', category: 'Network', status: 'Update Avail.', version: '22.190.0' },
      { name: 'Samsung SSD 980 PRO (Mock)', category: 'Storage', status: 'Optimal', version: '5B2QGXA7' },
    ];
  }

  async getSecurityIntegrity(): Promise<Array<{ name: string; status: string }>> {
    return [
      { name: 'Core OS Files', status: 'Verified' },
      { name: 'Driver Digital Signatures', status: 'Verified' },
      { name: 'Registry Hive Consistency', status: 'Verified' },
      { name: 'User Profile Encryption', status: 'Active' },
    ];
  }

  async getStabilityEvents(): Promise<Array<{ id: string; label: string; details: string; timestamp: number; type: 'rose' | 'amber' }>> {
    return [
      {
        id: 'crash-explorer',
        label: 'App Crash • 2h ago (Mock)',
        details: '"explorer.exe" stopped responding. Exception: 0xc0000005.',
        timestamp: Date.now() - 7200000,
        type: 'rose'
      },
      {
        id: 'warning-spooler',
        label: 'Service Warning • 5h ago (Mock)',
        details: '"Spooler" service timed out during startup initialization.',
        timestamp: Date.now() - 18000000,
        type: 'amber'
      }
    ];
  }

  async runNetworkLatencyTest(target = 'https://www.google.com/favicon.ico'): Promise<number> {
    const samples = 3;
    let total = 0;
    let successfulSamples = 0;
    
    for (let i = 0; i < samples; i++) {
      const start = performance.now();
      try {
        await fetch(target, { mode: 'no-cors', cache: 'no-cache' });
        total += (performance.now() - start);
        successfulSamples++;
      } catch (e) {
        // Fallback
      }
    }
    
    const finalLatency = successfulSamples > 0 ? Math.round(total / successfulSamples) : Math.floor(Math.random() * 20) + 15;
    this.lastLatency = finalLatency;
    return finalLatency;
  }

  async getNetworkForensics(): Promise<Array<{ name: string; down: string; up: string; type: string }>> {
    return [
      { name: 'Sentinel Persistence Sync', down: '0.05 Mbps', up: '0.02 Mbps', type: 'Local' },
      { name: 'Gemini Knowledge Stream', down: '1.24 Mbps', up: '0.15 Mbps', type: 'WAN' },
      { name: 'Background CDN Cache', down: '0.85 Mbps', up: '0.00 Mbps', type: 'WAN' },
    ];
  }

  async startVolumeScan(dirHandleName: string): Promise<{ files: StorageReport[]; totalSize: number }> {
    const files: StorageReport[] = [
      { path: 'System32/drivers/nvlddmkm.sys', size: 45 * 1024 * 1024, lastModified: Date.now() - 100000, isLarge: false },
      { path: 'Program Files/Steam/common/heavy_assets.pak', size: 1.2 * 1024 * 1024 * 1024, lastModified: Date.now() - 200000, isLarge: true },
      { path: 'Users/Sentinel/AppData/Local/Temp/temp_cache.log', size: 12 * 1024 * 1024, lastModified: Date.now() - 50000, isLarge: false }
    ];
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    return { files, totalSize };
  }
}

// Rename/Compatibility Alias
export class LocalDiagnosticProvider extends MockDiagnosticProvider {}
