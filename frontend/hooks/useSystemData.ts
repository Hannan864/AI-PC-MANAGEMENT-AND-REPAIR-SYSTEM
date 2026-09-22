
import { useState, useEffect } from 'react';
import { SystemStats, ProcessInfo } from '../types';
import { diagnosticProvider } from '../services/diagnosticProvider';
import { telemetryStreamManager } from '../services/telemetryStreamManager';
import { db } from '../services/db';

export const useSystemData = () => {
  const [stats, setStats] = useState<SystemStats>({
    cpu: 0, ram: 0, disk: 0, temp: 0, networkDown: 0, networkUp: 0, timestamp: Date.now()
  });

  const [processes, setProcesses] = useState<ProcessInfo[]>([]);

  useEffect(() => {
    let mounted = true;

    // 1. Subscribe to real-time stream (WebSocket with polling fallback)
    const unsubscribe = telemetryStreamManager.subscribe((newStats) => {
      if (!mounted) return;
      setStats(newStats);
      
      // Persist metrics occasionally
      if (Math.floor(Date.now() / 1000) % 30 === 0) {
        db.saveMetric(newStats).catch(() => {});
      }
    });

    // 2. Poll processes separately (since stream is stats only)
    const pollProcesses = async () => {
      try {
        const procList = await diagnosticProvider.getProcesses();
        if (mounted) setProcesses(procList);
      } catch (err) {
        console.warn("Process polling failed:", err);
      }
    };

    const procInterval = setInterval(pollProcesses, 5000);
    pollProcesses();

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(procInterval);
    };
  }, []);

  return { stats, processes };
};
