import { SystemStats } from '../types';
import { diagnosticProvider } from './diagnosticProvider';
import { WebSocketManager } from './websocketManager';
import { systemHealthMonitor } from './systemHealthMonitor';
import { telemetryAggregator } from './telemetryAggregator';

export type StreamCallback = (stats: SystemStats) => void;

class TelemetryStreamManagerClass {
  private callbacks: Set<StreamCallback> = new Set();
  private wsManager: WebSocketManager | null = null;
  private pollingIntervalId: any = null;
  private isRunning = false;
  
  // Custom polling rates.
  // Kept conservative: the backend dev server (PHP built-in server) is
  // single-threaded, so fast polling stacked dozens of queued requests and
  // starved interactive calls (status updates) until they timed out.
  private activeInterval = 4000; // 4 seconds when active
  private idleInterval = 10000;  // 10 seconds when idle
  private currentInterval = 4000;
  
  private isIdle = false;
  private lastActivityTime = Date.now();
  private idleTimeout = 30000; // 30 seconds of no mouse/keyboard = idle

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for window visibility to pause/idle immediately
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.setIdleState(true);
        } else {
          this.setIdleState(false);
          this.trackActivity();
        }
      });

      // Track user interaction to detect active state
      const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
      events.forEach(evt => {
        window.addEventListener(evt, () => this.trackActivity());
      });

      // Check idle timer periodically
      setInterval(() => {
        if (Date.now() - this.lastActivityTime > this.idleTimeout && !this.isIdle) {
          this.setIdleState(true);
        }
      }, 5000);
    }
  }

  private trackActivity() {
    this.lastActivityTime = Date.now();
    if (this.isIdle) {
      this.setIdleState(false);
    }
  }

  private setIdleState(idle: boolean) {
    this.isIdle = idle;
    const nextInterval = idle ? this.idleInterval : this.activeInterval;
    if (nextInterval !== this.currentInterval) {
      this.currentInterval = nextInterval;
      console.log(`[TelemetryStream] System is ${idle ? 'IDLE' : 'ACTIVE'}. Throttling interval to ${nextInterval}ms`);
      if (this.isRunning) {
        // Adjust polling timer on the fly if active
        const wsStatus = this.wsManager?.getStatus();
        if (wsStatus !== 'OPEN') {
          this.stopPolling();
          this.startPolling();
        }
      }
    }
  }

  public subscribe(callback: StreamCallback): () => void {
    this.callbacks.add(callback);
    if (!this.isRunning) {
      this.start();
    }
    return () => {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0) {
        this.stop();
      }
    };
  }

  private start() {
    this.isRunning = true;
    this.connectWebSocket();
  }

  private stop() {
    this.isRunning = false;
    if (this.wsManager) {
      this.wsManager.disconnect();
      this.wsManager = null;
    }
    this.stopPolling();
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      if (this.wsManager) {
        this.wsManager.disconnect();
      }

      const version = localStorage.getItem('settings.apiVersion') || 'v1';

      this.wsManager = new WebSocketManager({
        url: `ws://localhost:5000/api/${version}/stream`,
        onMessage: (rawData) => {
          // Normalize and broadcast
          const formattedStats = this.normalizeStats(rawData);
          // Pipe through the aggregation layer
          telemetryAggregator.processSample(formattedStats);
          this.broadcast(formattedStats);
        },
        onStateChange: (state) => {
          systemHealthMonitor.setWebSocketStatus(state);
          if (state === 'OPEN') {
            this.stopPolling();
          }
        },
        onFallbackTriggered: (reason) => {
          console.warn(`[TelemetryStream] WS offline: ${reason}. Active polling backup.`);
          this.startPolling();
        }
      });

      this.wsManager.connect();
    } catch (e) {
      console.warn('[TelemetryStream] WebSocket initialization failed, using polling backup.', e);
      this.startPolling();
    }
  }

  private startPolling() {
    this.stopPolling();
    
    const poll = async () => {
      try {
        const stats = await diagnosticProvider.getSystemStats();
        // Pipe through the aggregation layer to maintain sliding windows
        telemetryAggregator.processSample(stats);
        this.broadcast(stats);
      } catch (err) {
        console.warn('[TelemetryStream] Polling fetch caught error:', err);
      }
    };

    // run once immediately
    poll();
    
    this.pollingIntervalId = setInterval(poll, this.currentInterval);
  }

  private stopPolling() {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }

  private broadcast(stats: SystemStats) {
    this.callbacks.forEach(cb => {
      try {
        cb(stats);
      } catch (e) {
        console.error('[TelemetryStream] Error in stream subscriber callback:', e);
      }
    });
  }

  private normalizeStats(data: any): SystemStats {
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
}

export const telemetryStreamManager = new TelemetryStreamManagerClass();
