import React, { useState, useEffect } from 'react';

export interface HealthMonitorMetrics {
  totalRequests: number;
  failedRequests: number;
  successRequests: number;
  totalLatency: number;
  fallbackCount: number;
  validationFailureCount: number;
}

export interface HealthScoreBreakdown {
  latencyScore: number;          // Max 30
  uptimeScore: number;           // Max 25
  failureRateScore: number;      // Max 20
  schemaValidationScore: number; // Max 15
  websocketScore: number;        // Max 10
  total: number;                 // Max 100
  latencyDescription: string;
  uptimeDescription: string;
  failureDescription: string;
  schemaDescription: string;
  websocketDescription: string;
}

class SystemHealthMonitorClass {
  private metrics: HealthMonitorMetrics = {
    totalRequests: 0,
    failedRequests: 0,
    successRequests: 0,
    totalLatency: 0,
    fallbackCount: 0,
    validationFailureCount: 0,
  };

  private wsStatus: 'CONNECTING' | 'OPEN' | 'CLOSED' | 'RECONNECTING' = 'CLOSED';
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('system_health_metrics_v2');
      if (saved) {
        try {
          this.metrics = JSON.parse(saved);
        } catch (e) {
          console.warn("Failed to parse system health metrics:", e);
        }
      }
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('system_health_metrics_v2', JSON.stringify(this.metrics));
    }
    this.listeners.forEach((l) => l());
  }

  public setWebSocketStatus(status: 'CONNECTING' | 'OPEN' | 'CLOSED' | 'RECONNECTING') {
    this.wsStatus = status;
    this.save();
  }

  public recordRequest(latencyMs: number, success: boolean) {
    this.metrics.totalRequests++;
    if (success) {
      this.metrics.successRequests++;
      this.metrics.totalLatency += latencyMs;
    } else {
      this.metrics.failedRequests++;
    }
    this.save();
  }

  public recordFallback() {
    this.metrics.fallbackCount++;
    this.save();
  }

  public recordValidationFailure() {
    this.metrics.validationFailureCount++;
    this.save();
  }

  public getMetrics(): HealthMonitorMetrics {
    return { ...this.metrics };
  }

  public getUptimePercentage(): number {
    const pythonAttempts = this.metrics.successRequests + this.metrics.failedRequests;
    if (pythonAttempts === 0) return 100;
    return Math.round((this.metrics.successRequests / pythonAttempts) * 100);
  }

  public getAverageLatency(): number {
    if (this.metrics.successRequests === 0) return 0;
    return Math.round(this.metrics.totalLatency / this.metrics.successRequests);
  }

  /**
   * PRODUCERS GRADED ENTERPRISE FORMULA
   * Decouples, grades, and structures breakdown explanations for platform scores.
   */
  public getHealthBreakdown(): HealthScoreBreakdown {
    const metrics = this.metrics;
    
    // 1. API Latency Score (30%)
    const avgLatency = this.getAverageLatency();
    let latencyScore = 30;
    let latencyDescription = "No requests recorded - baseline latency optimal.";
    
    if (metrics.successRequests > 0) {
      if (avgLatency <= 100) {
        latencyScore = 30;
        latencyDescription = `Exceptional response times averaging ${avgLatency}ms.`;
      } else if (avgLatency <= 250) {
        latencyScore = 24;
        latencyDescription = `Nominal response times averaging ${avgLatency}ms.`;
      } else if (avgLatency <= 600) {
        latencyScore = 15;
        latencyDescription = `Degraded response latency averaging ${avgLatency}ms.`;
      } else {
        latencyScore = 5;
        latencyDescription = `Critical latency issues detected: ${avgLatency}ms average runtime.`;
      }
    }

    // 2. Backend Uptime Stability (25%)
    const uptimePct = this.getUptimePercentage();
    const uptimeScore = Math.round((uptimePct / 100) * 25);
    const uptimeDescription = `Uptime stability rating at ${uptimePct}%.`;

    // 3. Failure Rate Inverse Score (20%)
    let failureRateScore = 20;
    let failureDescription = "Perfect API transmission reliability.";
    const totalRestRuns = metrics.successRequests + metrics.failedRequests;
    if (totalRestRuns > 0) {
      const failRatio = metrics.failedRequests / totalRestRuns;
      failureRateScore = Math.round((1 - failRatio) * 20);
      failureDescription = `Service transmission failure rate is ${(failRatio * 100).toFixed(1)}%.`;
    }

    // 4. Schema Validation Success Score (15%)
    // Every schema validation failure represents dangerous payload structures;
    // We deduct 3 points per failure down to absolute 0
    const schemaValidationScore = Math.max(0, 15 - (metrics.validationFailureCount * 3));
    const schemaDescription = metrics.validationFailureCount === 0 
      ? "Fully compliant TypeScript data layer schemas." 
      : `Detected ${metrics.validationFailureCount} schema validation contract anomalies.`;

    // 5. WebSocket Stability Score (10%)
    let websocketScore = 0;
    let websocketDescription = "";
    switch (this.wsStatus) {
      case 'OPEN':
        websocketScore = 10;
        websocketDescription = "WebSocket connected. High-fidelity streams active.";
        break;
      case 'CONNECTING':
      case 'RECONNECTING':
        websocketScore = 5;
        websocketDescription = "WebSocket is currently negotiating link handshakes.";
        break;
      case 'CLOSED':
      default:
        websocketScore = 2;
        websocketDescription = "WebSocket channel is idle/offline. Polling fallback active.";
        break;
    }

    const total = latencyScore + uptimeScore + failureRateScore + schemaValidationScore + websocketScore;

    return {
      latencyScore,
      uptimeScore,
      failureRateScore,
      schemaValidationScore,
      websocketScore,
      total: Math.min(100, Math.max(0, total)),
      latencyDescription,
      uptimeDescription,
      failureDescription,
      schemaDescription,
      websocketDescription
    };
  }

  public getHealthScore(): number {
    return this.getHealthBreakdown().total;
  }

  public reset() {
    this.metrics = {
      totalRequests: 0,
      failedRequests: 0,
      successRequests: 0,
      totalLatency: 0,
      fallbackCount: 0,
      validationFailureCount: 0,
    };
    this.wsStatus = 'CLOSED';
    this.save();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const systemHealthMonitor = new SystemHealthMonitorClass();

export const useSystemHealthMonitor = () => {
  const [metrics, setMetrics] = useState<HealthMonitorMetrics>(systemHealthMonitor.getMetrics());
  const [score, setScore] = useState<number>(systemHealthMonitor.getHealthScore());
  const [breakdown, setBreakdown] = useState<HealthScoreBreakdown>(systemHealthMonitor.getHealthBreakdown());
  const [averageLatency, setAverageLatency] = useState<number>(systemHealthMonitor.getAverageLatency());
  const [uptime, setUptime] = useState<number>(systemHealthMonitor.getUptimePercentage());

  useEffect(() => {
    return systemHealthMonitor.subscribe(() => {
      setMetrics(systemHealthMonitor.getMetrics());
      setScore(systemHealthMonitor.getHealthScore());
      setBreakdown(systemHealthMonitor.getHealthBreakdown());
      setAverageLatency(systemHealthMonitor.getAverageLatency());
      setUptime(systemHealthMonitor.getUptimePercentage());
    });
  }, []);

  return {
    metrics,
    score,
    breakdown,
    averageLatency,
    uptime,
    resetMetrics: () => systemHealthMonitor.reset()
  };
};
