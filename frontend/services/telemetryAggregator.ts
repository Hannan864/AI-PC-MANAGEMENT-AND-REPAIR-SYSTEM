/**
 * TELEMETRY AGGREGATION LAYER
 * Maintains sliding-window statistics of volatile telemetry data, applying decimation
 * and sampling filters before committing logs to prevent IndexedDB store exhaustion.
 */

import { SystemStats } from '../types';
import { db } from './db';

export interface StatAverages {
  cpu: number;
  ram: number;
  networkDown: number;
  networkUp: number;
  temp: number;
}

export class TelemetryAggregator {
  // Sliding buffers for high-density historical calculations
  private buffer30s: SystemStats[] = [];
  private lastSavedTimestamp = 0;
  
  // Storing threshold limits
  private saveDebounceMs = 15000; // Only write telemetry snapshots to DB once every 15 seconds
  private volatilityThreshold = 15; // Save instantly if CPU or RAM jumps/drops > 15% (out-of-band alert capture)

  /**
   * Absorb a volatile real-time sample. Returns sliding averages and flag indicating DB save.
   */
  public processSample(stats: SystemStats): {
    averages5s: StatAverages;
    averages30s: StatAverages;
    persisted: boolean;
  } {
    const now = Date.now();
    this.buffer30s.push({ ...stats, timestamp: now });
    
    // Prune expired records outside 30 seconds
    const cutoff30s = now - 30000;
    this.buffer30s = this.buffer30s.filter(s => s.timestamp >= cutoff30s);
    
    const averages5s = this.calculateAverage(5000);
    const averages30s = this.calculateAverage(30000);

    // Apply decimation storage rule (prevent DB bloat/overload)
    const shouldPersist = this.checkPersistenceCriteria(stats, now);
    if (shouldPersist) {
      this.persistSnapshot(stats, averages30s);
      this.lastSavedTimestamp = now;
    }

    return {
      averages5s,
      averages30s,
      persisted: shouldPersist
    };
  }

  /**
   * Helper that calculates rolling average over specified sliding milliseconds window.
   */
  private calculateAverage(windowMs: number): StatAverages {
    const now = Date.now();
    const threshold = now - windowMs;
    const samples = this.buffer30s.filter(s => s.timestamp >= threshold);

    if (samples.length === 0) {
      return { cpu: 0, ram: 0, networkDown: 0, networkUp: 0, temp: 0 };
    }

    let cpuSum = 0;
    let ramSum = 0;
    let netDownSum = 0;
    let netUpSum = 0;
    let tempSum = 0;

    samples.forEach(s => {
      cpuSum += s.cpu;
      ramSum += s.ram;
      netDownSum += s.networkDown;
      netUpSum += s.networkUp;
      tempSum += s.temp;
    });

    const len = samples.length;
    return {
      cpu: Math.round(cpuSum / len),
      ram: Math.round(ramSum / len),
      networkDown: parseFloat((netDownSum / len).toFixed(2)),
      networkUp: parseFloat((netUpSum / len).toFixed(2)),
      temp: Math.round(tempSum / len)
    };
  }

  /**
   * Determine whether this raw high-frequency sample warrants IndexedDB commitment.
   */
  private checkPersistenceCriteria(stats: SystemStats, now: number): boolean {
    if (this.lastSavedTimestamp === 0) return true;

    const timePassedMs = now - this.lastSavedTimestamp;
    
    // 1. Primary rule: Save at regular interval
    if (timePassedMs >= this.saveDebounceMs) {
      return true;
    }

    // 2. Out-of-band volatility rule: If CPU or RAM spikes/drops sharply, capture immediately
    const lastSavedNode = this.buffer30s.find(s => s.timestamp === this.lastSavedTimestamp);
    if (lastSavedNode) {
      const cpuDelta = Math.abs(stats.cpu - lastSavedNode.cpu);
      const ramDelta = Math.abs(stats.ram - lastSavedNode.ram);
      if (cpuDelta >= this.volatilityThreshold || ramDelta >= this.volatilityThreshold) {
        console.log(`[TelemetryAggregator] Volatility trigger. Delta: CPU ${cpuDelta}%, RAM ${ramDelta}%. Force persisting...`);
        return true;
      }
    }

    return false;
  }

  /**
   * Commits the filtered snapshot to IndexedDB.
   */
  private async persistSnapshot(raw: SystemStats, averages: StatAverages) {
    try {
      await db.init();
      // Store under system snapshots or settings tracking
      const historicLog = await db.getSetting('telemetry.historical_snapshots') || [];
      const newSnapshot = {
        timestamp: raw.timestamp,
        raw,
        averages30s: averages
      };

      // Keep historical timeline limited to 100 entries to prevent DB bloat
      const updatedList = [newSnapshot, ...historicLog].slice(0, 100);
      await db.setSetting('telemetry.historical_snapshots', updatedList);
    } catch (err) {
      console.warn('[TelemetryAggregator] IndexedDBSave snapshot failed:', err);
    }
  }

  /**
   * Retrieves aggregated historical trends.
   */
  public async getHistory(): Promise<any[]> {
    try {
      await db.init();
      return await db.getSetting('telemetry.historical_snapshots') || [];
    } catch (e) {
      return [];
    }
  }
}

export const telemetryAggregator = new TelemetryAggregator();
