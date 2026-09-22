/**
 * WEBSOCKET LIFECYCLE MANAGER
 * Handles resilient real-time endpoint socket links, keeping channels lively
 * via exponential backoffs, stale link detection, and ping-pong signals.
 */

export type WebSocketState = 'CONNECTING' | 'OPEN' | 'CLOSED' | 'RECONNECTING';

export interface WSManagerOptions {
  url: string;
  onMessage: (data: any) => void;
  onStateChange?: (state: WebSocketState) => void;
  onFallbackTriggered: (reason: string) => void;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private state: WebSocketState = 'CLOSED';
  private reconnectAttempt = 0;
  private maxReconnectDelay = 10000; // 10 seconds max delay
  private baseReconnectDelay = 1000; // 1 second base delay
  private reconnectTimer: any = null;
  
  // Heartbeat Config
  private heartbeatInterval = 15000; // 15 seconds
  private staleTimeout = 5000;       // 5 seconds to respond
  private heartbeatIntervalId: any = null;
  private staleTimeoutId: any = null;
  private lastPongReceived = Date.now();

  private isGracefullyClosed = false;

  constructor(private options: WSManagerOptions) {}

  public connect() {
    if (typeof window === 'undefined') return;
    
    this.isGracefullyClosed = false;
    this.terminateWebSocket();
    this.stopHeartbeat();

    this.setState('CONNECTING');
    console.log(`[WSManager] Connecting to ${this.options.url}...`);

    try {
      this.ws = new WebSocket(this.options.url);
      this.setupHandlers();
    } catch (err) {
      this.handleConnectionFailure('Initialization exception');
    }
  }

  public disconnect() {
    this.isGracefullyClosed = true;
    this.setState('CLOSED');
    this.terminateWebSocket();
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempt = 0;
  }

  public getStatus(): WebSocketState {
    return this.state;
  }

  private setupHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.setState('OPEN');
      this.reconnectAttempt = 0;
      this.lastPongReceived = Date.now();
      this.startHeartbeat();
      console.log('[WSManager] WebSocket stream connected and active.');
    };

    this.ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        
        // Intercept Heartbeat pong response
        if (raw && raw.type === 'pong') {
          this.lastPongReceived = Date.now();
          if (this.staleTimeoutId) {
            clearTimeout(this.staleTimeoutId);
            this.staleTimeoutId = null;
          }
          return;
        }

        this.options.onMessage(raw);
      } catch (err) {
        console.warn('[WSManager] Error parsing JSON payload:', err);
      }
    };

    this.ws.onerror = (err) => {
      console.warn('[WSManager] WebSocket encountered error:', err);
      // Let onclose handle the recovery logic
    };

    this.ws.onclose = (event) => {
      if (this.isGracefullyClosed) {
        this.setState('CLOSED');
        return;
      }
      this.handleConnectionFailure(`Closed with code ${event.code}`);
    };
  }

  private handleConnectionFailure(reason: string) {
    this.stopHeartbeat();
    this.terminateWebSocket();

    if (this.isGracefullyClosed) return;

    // Trigger graceful fallback immediately to avoid service interruption
    this.options.onFallbackTriggered(reason);

    this.setState('RECONNECTING');
    this.reconnectAttempt++;
    
    // Exponential backoff: 1s, 2s, 5s, 10s max (calculated delay)
    // 1st block: 1000 * 2^1 = 2000 => min with 10s => 2s
    const exponent = Math.min(this.reconnectAttempt, 4); // limit power to prevent integer drift
    const delay = Math.min(this.baseReconnectDelay * Math.pow(2, exponent - 1), this.maxReconnectDelay);

    console.log(`[WSManager] Link collapsed (${reason}). Attempting reconnect #${this.reconnectAttempt} in ${delay}ms...`);

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatIntervalId = setInterval(() => {
      this.sendPing();
    }, this.heartbeatInterval);
  }

  private sendPing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'ping' }));
        this.lastPongReceived = Date.now();
        
        // Start stale timeout watcher
        if (this.staleTimeoutId) clearTimeout(this.staleTimeoutId);
        this.staleTimeoutId = setTimeout(() => {
          this.detectStaleLink();
        }, this.staleTimeout);
      } catch (e) {
        this.handleConnectionFailure('Failed to transmit ping heartbeat signal');
      }
    }
  }

  private detectStaleLink() {
    const elapsedSinceLastPong = Date.now() - this.lastPongReceived;
    if (elapsedSinceLastPong >= this.staleTimeout) {
      console.warn('[WSManager] No heartbeat pong received within threshold. Link detected as stale.');
      this.handleConnectionFailure('Stale link detected');
    }
  }

  private stopHeartbeat() {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
    if (this.staleTimeoutId) {
      clearTimeout(this.staleTimeoutId);
      this.staleTimeoutId = null;
    }
  }

  private terminateWebSocket() {
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
  }

  private setState(newState: WebSocketState) {
    this.state = newState;
    if (this.options.onStateChange) {
      try {
        this.options.onStateChange(newState);
      } catch (e) {
        console.error('[WSManager] State change handler exception:', e);
      }
    }
  }
}
