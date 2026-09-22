import { SystemStats, ProcessInfo, StorageReport, AuditLog, ServiceType } from '../types';
import { db } from './db';

export class TelemetrySchemaValidator {
  private static async logFailure(operation: string, details: string) {
    console.error(`[SchemaValidationFailure] Operation: ${operation}. Details: ${details}`);
    try {
      await db.init();
      await db.addLog({
        id: `validation-fail-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        service: ServiceType.HEALTH,
        message: `Telemetry schema validation failed on ${operation}: ${details}`,
        type: 'error'
      });
    } catch (err) {
      console.warn("Could not write validation failure to db:", err);
    }
  }

  static validateSystemStats(data: any): SystemStats {
    if (!data || typeof data !== 'object') {
      this.logFailure('getSystemStats', 'Input is null or not an object');
      throw new Error('Invalid SystemStats input: not an object');
    }

    const missingFields: string[] = [];
    if (typeof data.cpu !== 'number') missingFields.push('cpu');
    if (typeof data.ram !== 'number') missingFields.push('ram');
    if (typeof data.disk !== 'number') missingFields.push('disk');
    if (typeof data.temp !== 'number') missingFields.push('temp');
    if (typeof data.networkDown !== 'number') missingFields.push('networkDown');
    if (typeof data.networkUp !== 'number') missingFields.push('networkUp');

    if (missingFields.length > 0) {
      this.logFailure('getSystemStats', `Missing or invalid fields: ${missingFields.join(', ')}`);
    }

    return {
      cpu: typeof data.cpu === 'number' ? data.cpu : 0,
      ram: typeof data.ram === 'number' ? data.ram : 0,
      disk: typeof data.disk === 'number' ? data.disk : 0,
      temp: typeof data.temp === 'number' ? data.temp : 0,
      networkDown: typeof data.networkDown === 'number' ? data.networkDown : 0,
      networkUp: typeof data.networkUp === 'number' ? data.networkUp : 0,
      timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
      batteryLevel: typeof data.batteryLevel === 'number' ? data.batteryLevel : undefined,
      isCharging: typeof data.isCharging === 'boolean' ? data.isCharging : undefined,
    };
  }

  static validateProcesses(data: any): ProcessInfo[] {
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.processes) ? data.processes : null);
    if (!list) {
      this.logFailure('getProcesses', 'Input processes is not an array');
      return [];
    }

    return list.map((p: any, idx: number) => {
      if (!p || typeof p !== 'object') {
        this.logFailure('getProcesses', `Element at index ${idx} is not an object`);
        return { id: idx, name: 'Malformed Process', cpu: 0, ram: 0, impact: 'Low' as const, status: 'Active' as const };
      }
      return {
        id: typeof p.id === 'number' ? p.id : idx,
        name: typeof p.name === 'string' ? p.name : 'Unknown Process',
        cpu: typeof p.cpu === 'number' ? p.cpu : 0,
        ram: typeof p.ram === 'number' ? p.ram : 0,
        impact: ['High', 'Medium', 'Low'].includes(p.impact) ? p.impact : 'Low',
        status: ['Active', 'Background', 'Suspended'].includes(p.status) ? p.status : 'Active',
      };
    });
  }

  static validateOptimizeResponse(data: any): { ramRecovered: number; cacheStorePurged: number } {
    if (!data || typeof data !== 'object') {
      this.logFailure('optimizeSystem', 'Response is not an object');
      return { ramRecovered: 0, cacheStorePurged: 0 };
    }
    return {
      ramRecovered: typeof data.ramRecovered === 'number' ? data.ramRecovered : 0,
      cacheStorePurged: typeof data.cacheStorePurged === 'number' ? data.cacheStorePurged : 0,
    };
  }

  static validateHardwareInventory(data: any): Array<{ name: string; category: string; status: string; version: string }> {
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.inventory) ? data.inventory : null);
    if (!list) {
      this.logFailure('getHardwareInventory', 'Data is not an array');
      return [];
    }

    return list.map((h: any, idx: number) => {
      if (!h || typeof h !== 'object') {
        return { name: 'Unknown Hardware', category: 'General', status: 'Unknown', version: 'N/A' };
      }
      return {
        name: typeof h.name === 'string' ? h.name : 'Unknown Hardware',
        category: typeof h.category === 'string' ? h.category : 'General',
        status: typeof h.status === 'string' ? h.status : 'Unknown',
        version: typeof h.version === 'string' ? h.version : 'N/A',
      };
    });
  }

  static validateSecurityIntegrity(data: any): Array<{ name: string; status: string }> {
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.integrity) ? data.integrity : null);
    if (!list) {
      this.logFailure('getSecurityIntegrity', 'Data is not an array');
      return [];
    }
    return list.map((s: any) => ({
      name: s && typeof s.name === 'string' ? s.name : 'Unknown Verification Flag',
      status: s && typeof s.status === 'string' ? s.status : 'Unknown',
    }));
  }

  static validateStabilityEvents(data: any): Array<{ id: string; label: string; details: string; timestamp: number; type: 'rose' | 'amber' }> {
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.events) ? data.events : null);
    if (!list) {
      this.logFailure('getStabilityEvents', 'Data is not an array');
      return [];
    }
    return list.map((e: any, idx: number) => ({
      id: e && typeof e.id === 'string' ? e.id : `event-${idx}`,
      label: e && typeof e.label === 'string' ? e.label : 'Security Event Flag',
      details: e && typeof e.details === 'string' ? e.details : '',
      timestamp: e && typeof e.timestamp === 'number' ? e.timestamp : Date.now(),
      type: e && ['rose', 'amber'].includes(e.type) ? e.type : 'amber',
    }));
  }

  static validateNetworkLatency(data: any): number {
    const value = typeof data === 'number' ? data : (data && typeof data.latency === 'number' ? data.latency : null);
    if (value === null) {
      this.logFailure('runNetworkLatencyTest', 'Invalid latency response value');
      return -1;
    }
    return value;
  }

  static validateNetworkForensics(data: any): Array<{ name: string; down: string; up: string; type: string }> {
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.forensics) ? data.forensics : null);
    if (!list) {
      this.logFailure('getNetworkForensics', 'Data is not an array');
      return [];
    }
    return list.map((n: any) => ({
      name: n && typeof n.name === 'string' ? n.name : 'Interface Link',
      down: n && typeof n.down === 'string' ? n.down : '0.00 Mbps',
      up: n && typeof n.up === 'string' ? n.up : '0.00 Mbps',
      type: n && typeof n.type === 'string' ? n.type : 'WAN',
    }));
  }

  static validateVolumeScan(data: any): { files: StorageReport[]; totalSize: number } {
    if (!data || typeof data !== 'object') {
      this.logFailure('startVolumeScan', 'Data is not an object');
      return { files: [], totalSize: 0 };
    }
    const filesArray = Array.isArray(data.files) ? data.files : [];
    const validatedFiles = filesArray.map((f: any) => ({
      path: f && typeof f.path === 'string' ? f.path : 'Unknown Path',
      size: f && typeof f.size === 'number' ? f.size : 0,
      lastModified: f && typeof f.lastModified === 'number' ? f.lastModified : Date.now(),
      isLarge: f && typeof f.isLarge === 'boolean' ? f.isLarge : false,
    }));
    return {
      files: validatedFiles,
      totalSize: typeof data.totalSize === 'number' ? data.totalSize : 0,
    };
  }
}
