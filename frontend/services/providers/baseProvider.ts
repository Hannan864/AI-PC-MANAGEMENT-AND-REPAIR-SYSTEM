import { SystemStats, ProcessInfo, StorageReport } from '../../types';

/**
 * Future-Proof Telemetry & Diagnostics Abstraction Layer
 */
export interface DiagnosticProvider {
  /** Retrieves high-frequency real-time physical resource stats */
  getSystemStats(): Promise<SystemStats>;

  /** Retrieves system tasks and private working sets */
  getProcesses(): Promise<ProcessInfo[]>;

  /** Triggers memory consolidation and RAM cache flushes */
  optimizeSystem(currentProcesses: ProcessInfo[]): Promise<{ ramRecovered: number; cacheStorePurged: number }>;

  /** Gathers hardware specifications and inventory elements */
  getHardwareInventory(): Promise<Array<{ name: string; category: string; status: string; version: string }>>;

  /** Verifies operating system file signatures, profile encryptions, and security zones */
  getSecurityIntegrity(): Promise<Array<{ name: string; status: string }>>;

  /** Retrieves system event anomalies, application crashes, and security warnings */
  getStabilityEvents(): Promise<Array<{ id: string; label: string; details: string; timestamp: number; type: 'rose' | 'amber' }>>;

  /** Runs standard ICMP ping packets or HTTP latency samples */
  runNetworkLatencyTest(target?: string): Promise<number>;

  /** Pulls multiplexed background link performance statistics */
  getNetworkForensics(): Promise<Array<{ name: string; down: string; up: string; type: string }>>;

  /** Triggers real directory forensics and sector volume indexing */
  startVolumeScan(dirHandleName: string): Promise<{ files: StorageReport[]; totalSize: number }>;
}
