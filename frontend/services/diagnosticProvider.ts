import React, { useState, useEffect } from 'react';
import { SystemStats, ProcessInfo, StorageReport, ServiceType } from '../types';
import { db } from './db';
import { DiagnosticProvider } from './providers/baseProvider';
import { MockDiagnosticProvider, LocalDiagnosticProvider } from './providers/mockProvider';
import { PythonDiagnosticProvider } from './providers/pythonProvider';
import { telemetryBridge } from './telemetryBridge';

export { MockDiagnosticProvider, LocalDiagnosticProvider, PythonDiagnosticProvider };
export type { DiagnosticProvider };

/**
 * TELEMETRY PROVIDER MANAGER
 * Orchestrates current source state and broadcasts changes.
 */
export class ProviderManager {
  private mode: 'MOCK' | 'PYTHON' = 'MOCK';
  private fallbackActive = false;
  private changeListeners: Array<(mode: 'MOCK' | 'PYTHON', fallback: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('telemetry_source');
      if (saved === 'PYTHON' || saved === 'MOCK') {
        this.mode = saved;
      }
      this.loadSavedMode();
    }
  }

  async loadSavedMode() {
    try {
      await db.init();
      const savedDb = await db.getSetting('settings.telemetryMode') || await db.getSetting('telemetry_source');
      if (savedDb === 'PYTHON' || savedDb === 'MOCK') {
        this.mode = savedDb;
        this.notify();
      }
    } catch (err) {
      console.warn("Telemetry init load from DB failed:", err);
    }
  }

  getMode(): 'MOCK' | 'PYTHON' {
    return this.mode;
  }

  isFallbackActive(): boolean {
    return this.fallbackActive;
  }

  async setMode(mode: 'MOCK' | 'PYTHON') {
    this.mode = mode;
    this.fallbackActive = false; 
    if (typeof window !== 'undefined') {
      localStorage.setItem('telemetry_source', mode);
      try {
        await db.init();
        await db.setSetting('settings.telemetryMode', mode);
        await db.setSetting('telemetry_source', mode);
      } catch (err) {
        console.warn("DB settings fallback write failed:", err);
      }
    }
    this.notify();
  }

  triggerFallback() {
    if (!this.fallbackActive) {
      this.fallbackActive = true;
      this.notify();
      
      db.init().then(() => {
        db.addLog({
          id: `failsafe-${Date.now()}`,
          timestamp: Date.now(),
          service: ServiceType.HEALTH,
          message: "Python Diagnostic Service unavailable. Switched to Mock Diagnostics.",
          type: 'error'
        });
      }).catch(e => console.error("Logged failsafe fails:", e));
    }
  }

  clearFallback() {
    if (this.fallbackActive) {
      this.fallbackActive = false;
      this.notify();
    }
  }

  subscribe(listener: (mode: 'MOCK' | 'PYTHON', fallback: boolean) => void) {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.changeListeners.forEach(l => l(this.mode, this.fallbackActive));
  }
}

export const TelemetryProviderManager = new ProviderManager();

/**
 * UNIFIED DYNAMIC DELEGATE
 * Passes telemetry calls through the TelemetryBridge layer.
 */
export const diagnosticProvider: DiagnosticProvider = {
  getSystemStats() {
    return telemetryBridge.getSystemStats();
  },
  getProcesses() {
    return telemetryBridge.getProcesses();
  },
  optimizeSystem(currentProcesses) {
    return telemetryBridge.optimizeSystem(currentProcesses);
  },
  getHardwareInventory() {
    return telemetryBridge.getHardwareInventory();
  },
  getSecurityIntegrity() {
    return telemetryBridge.getSecurityIntegrity();
  },
  getStabilityEvents() {
    return telemetryBridge.getStabilityEvents();
  },
  runNetworkLatencyTest(target) {
    return telemetryBridge.runNetworkLatencyTest(target);
  },
  getNetworkForensics() {
    return telemetryBridge.getNetworkForensics();
  },
  startVolumeScan(dirHandleName) {
    return telemetryBridge.startVolumeScan(dirHandleName);
  }
};

/**
 * React Hook for consuming the global telemetry setting reactively.
 */
export const useTelemetryMode = () => {
  const [telemetryMode, setTelemetryMode] = useState<'MOCK' | 'PYTHON'>(TelemetryProviderManager.getMode());
  const [isFallbackActive, setIsFallbackActive] = useState(TelemetryProviderManager.isFallbackActive());

  useEffect(() => {
    return TelemetryProviderManager.subscribe((mode, fallback) => {
      setTelemetryMode(mode);
      setIsFallbackActive(fallback);
    });
  }, []);

  const setMode = (mode: 'MOCK' | 'PYTHON') => {
    TelemetryProviderManager.setMode(mode);
  };

  const clearFallback = () => {
    TelemetryProviderManager.clearFallback();
  };

  return { telemetryMode, isFallbackActive, setMode, clearFallback };
};
