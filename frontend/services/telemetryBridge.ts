import { SystemStats, ProcessInfo, StorageReport, AuditLog, ServiceType } from '../types';
import { DiagnosticProvider } from './providers/baseProvider';
import { MockDiagnosticProvider } from './providers/mockProvider';
import { PythonDiagnosticProvider } from './providers/pythonProvider';
import { TelemetryProviderManager } from './diagnosticProvider';
import { TelemetrySchemaValidator } from './telemetrySchemaValidator';
import { systemHealthMonitor } from './systemHealthMonitor';
import { db } from './db';

/**
 * TELEMETRY BRIDGE
 * Handles routing, retries, and fallback logic for live/mock telemetry modes.
 * Integrates schema validation and system health monitoring instrumentation.
 */
export class TelemetryBridge implements DiagnosticProvider {
  private mockProvider = new MockDiagnosticProvider();
  private pythonProvider = new PythonDiagnosticProvider();
  private retryLimit = 2;

  /**
   * Status check of the entire system based on health monitors.
   */
  getSystemStatus(): 'Optimal' | 'Degraded' | 'Down' {
    const isFallback = TelemetryProviderManager.isFallbackActive();
    const mode = TelemetryProviderManager.getMode();
    
    if (mode === 'MOCK') return 'Optimal';
    if (isFallback) return 'Down';
    
    const score = systemHealthMonitor.getHealthScore();
    if (score < 60) return 'Degraded';
    return 'Optimal';
  }

  getCurrentMode(): 'MOCK' | 'PYTHON' {
    return TelemetryProviderManager.getMode();
  }

  getFailureStats() {
    return systemHealthMonitor.getMetrics();
  }

  private validateAndNormalize<T>(operationName: string, data: any): T {
    try {
      switch (operationName) {
        case 'getSystemStats':
          return TelemetrySchemaValidator.validateSystemStats(data) as unknown as T;
        case 'getProcesses':
          return TelemetrySchemaValidator.validateProcesses(data) as unknown as T;
        case 'optimizeSystem':
          return TelemetrySchemaValidator.validateOptimizeResponse(data) as unknown as T;
        case 'getHardwareInventory':
          return TelemetrySchemaValidator.validateHardwareInventory(data) as unknown as T;
        case 'getSecurityIntegrity':
          return TelemetrySchemaValidator.validateSecurityIntegrity(data) as unknown as T;
        case 'getStabilityEvents':
          return TelemetrySchemaValidator.validateStabilityEvents(data) as unknown as T;
        case 'runNetworkLatencyTest':
          return TelemetrySchemaValidator.validateNetworkLatency(data) as unknown as T;
        case 'getNetworkForensics':
          return TelemetrySchemaValidator.validateNetworkForensics(data) as unknown as T;
        case 'startVolumeScan':
          return TelemetrySchemaValidator.validateVolumeScan(data) as unknown as T;
        default:
          return data as T;
      }
    } catch (err) {
      systemHealthMonitor.recordValidationFailure();
      console.error(`[TelemetryBridge] Validation failure triggered for ${operationName}`, err);
      throw err;
    }
  }

  private async executeWithRetry<T>(
    operationName: string,
    pythonCall: () => Promise<T>,
    mockCall: () => Promise<T>
  ): Promise<T> {
    const mode = TelemetryProviderManager.getMode();
    const isFallback = TelemetryProviderManager.isFallbackActive();

    if (mode === 'MOCK' || isFallback) {
      const mockResult = await mockCall();
      return this.validateAndNormalize<T>(operationName, mockResult);
    }

    let attempts = 0;
    while (attempts < this.retryLimit) {
      const startTime = performance.now();
      try {
        const result = await pythonCall();
        const latency = performance.now() - startTime;
        
        systemHealthMonitor.recordRequest(latency, true);
        
        return this.validateAndNormalize<T>(operationName, result);
      } catch (err) {
        attempts++;
        systemHealthMonitor.recordRequest(0, false);
        console.warn(`[TelemetryBridge] Attempt ${attempts} failed for ${operationName}:`, err);
        
        if (attempts >= this.retryLimit) {
          console.error(`[TelemetryBridge] Fallback triggered due to persistent failure in ${operationName}`);
          TelemetryProviderManager.triggerFallback();
          systemHealthMonitor.recordFallback();
          
          try {
            await db.init();
            await db.addLog({
              id: `failsafe-${Date.now()}`,
              timestamp: Date.now(),
              service: ServiceType.HEALTH,
              message: `Python backend failure on ${operationName}: ${(err as Error).message || err}. Auto-switched to Mock mode.`,
              type: 'error'
            });
          } catch (logErr) {
            console.error("Failed to log fallback event in db:", logErr);
          }
          
          const fallbackData = await mockCall();
          return this.validateAndNormalize<T>(operationName, fallbackData);
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }
    const finalFallbackData = await mockCall();
    return this.validateAndNormalize<T>(operationName, finalFallbackData);
  }

  async getSystemStats(): Promise<SystemStats> {
    return this.executeWithRetry<SystemStats>(
      'getSystemStats',
      () => this.pythonProvider.getSystemStats(),
      () => this.mockProvider.getSystemStats()
    );
  }

  async getProcesses(): Promise<ProcessInfo[]> {
    return this.executeWithRetry<ProcessInfo[]>(
      'getProcesses',
      () => this.pythonProvider.getProcesses(),
      () => this.mockProvider.getProcesses()
    );
  }

  async optimizeSystem(currentProcesses: ProcessInfo[]): Promise<{ ramRecovered: number; cacheStorePurged: number }> {
    return this.executeWithRetry<{ ramRecovered: number; cacheStorePurged: number }>(
      'optimizeSystem',
      () => this.pythonProvider.optimizeSystem(currentProcesses),
      () => this.mockProvider.optimizeSystem(currentProcesses)
    );
  }

  async getHardwareInventory(): Promise<Array<{ name: string; category: string; status: string; version: string }>> {
    return this.executeWithRetry<Array<{ name: string; category: string; status: string; version: string }>>(
      'getHardwareInventory',
      () => this.pythonProvider.getHardwareInventory(),
      () => this.mockProvider.getHardwareInventory()
    );
  }

  async getSecurityIntegrity(): Promise<Array<{ name: string; status: string }>> {
    return this.executeWithRetry<Array<{ name: string; status: string }>>(
      'getSecurityIntegrity',
      () => this.pythonProvider.getSecurityIntegrity(),
      () => this.mockProvider.getSecurityIntegrity()
    );
  }

  async getStabilityEvents(): Promise<Array<{ id: string; label: string; details: string; timestamp: number; type: 'rose' | 'amber' }>> {
    return this.executeWithRetry<Array<{ id: string; label: string; details: string; timestamp: number; type: 'rose' | 'amber' }>>(
      'getStabilityEvents',
      () => this.pythonProvider.getStabilityEvents(),
      () => this.mockProvider.getStabilityEvents()
    );
  }

  async runNetworkLatencyTest(target?: string): Promise<number> {
    return this.executeWithRetry<number>(
      'runNetworkLatencyTest',
      () => this.pythonProvider.runNetworkLatencyTest(target),
      () => this.mockProvider.runNetworkLatencyTest(target)
    );
  }

  async getNetworkForensics(): Promise<Array<{ name: string; down: string; up: string; type: string }>> {
    return this.executeWithRetry<Array<{ name: string; down: string; up: string; type: string }>>(
      'getNetworkForensics',
      () => this.pythonProvider.getNetworkForensics(),
      () => this.mockProvider.getNetworkForensics()
    );
  }

  async startVolumeScan(dirHandleName: string): Promise<{ files: StorageReport[]; totalSize: number }> {
    return this.executeWithRetry<{ files: StorageReport[]; totalSize: number }>(
      'startVolumeScan',
      () => this.pythonProvider.startVolumeScan(dirHandleName),
      () => this.mockProvider.startVolumeScan(dirHandleName)
    );
  }
}

export const telemetryBridge = new TelemetryBridge();
