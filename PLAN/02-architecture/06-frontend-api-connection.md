# System Sentinel Platform — Frontend-to-Backend Connection Plan

This document details the interface mappings, telemetry stream lifecycle mechanisms, and client-side failover processes that connect the **React (Vite/TypeScript)** frontend with the **FastAPI (Python)** backend.

---

## 1. Metric Schema Alignment

To ensure data parsing is consistent and reliable, both Python models and TypeScript interfaces must follow the same shared contract defined in `/shared/telemetryContract.ts`:

```
          TypeScript Interface                     Python Pydantic Model
     
     interface SystemStats {                class SystemStatsModel(BaseModel):
       cpu: number;                <====>       cpu: float
       ram: number;                             ram: float
       disk: number;                            disk: float
       temp: number;                            temp: float
       networkDown: number;                     networkDown: float
       networkUp: number;                       networkUp: float
       timestamp: number;                       timestamp: int
     }                                      
```

---

## 2. Dynamic Streaming Lifecycle

The frontend data pipeline uses a unified stream manager (`telemetryStreamManager.ts`) to handle live metrics updates.

```
                          +------------------------+
                          |   Initialize Stream    |
                          +-----------+------------+
                                      |
                                      v
                          +-----------+------------+
                          |  Attempt WS Connection |
                          +-----------+------------+
                                      |
                        +-------------+-------------+
                        |                           |
                  [Success]                      [Fail]
                        |                           |
                        v                           v
          +-------------+-------------+    +--------+------------+
          | Start Live WebSocket Loop |    |  Switch to Backup   |
          | (1.5-second push rate)    |    |  REST API Polling   |
          +-------------+-------------+    +--------+------------+
                        |                           |
                        |                           | Retry with
                        |                           | Exponential Backoff
                        v                           | (1s, 2s, 5s, 10s)
          +-------------+-------------+             |
          | Close / Graceful Teardown | <===========+
          +---------------------------+
```

---

## 3. Communication Adapter Examples

### 3.1 REST API Fallback Fetch Adapter
```typescript
import { SystemStats } from '../shared/telemetryContract';

export async function fetchSystemPerformanceStats(version: string = 'v1'): Promise<SystemStats> {
  const hostUrl = `http://localhost:5000/api/${version}/performance`;
  
  try {
    const response = await fetch(hostUrl);
    if (!response.ok) {
        throw new Error(`HTTP transaction failed with status code ${response.status}`);
    }
    const data = await response.json();
    return data as SystemStats;
  } catch (err) {
    console.warn(`Connection error to ${hostUrl}. Switching to local mock statistics.`, err);
    throw err;
  }
}
```

### 3.2 WebSocket Streaming Client Adapter
```typescript
import { SystemStats } from '../shared/telemetryContract';

export class LiveTelemetryStream {
  private socket: WebSocket | null = null;
  private isReconnecting = false;
  private backoffDelayMs = 1000;

  constructor(
    private serverUrl: string,
    private onDataReceived: (stats: SystemStats) => void,
    private onFailoverRaised: () => void
  ) {}

  public connect() {
    this.socket = new WebSocket(this.serverUrl);

    this.socket.onmessage = (event) => {
      try {
        const rawStats = JSON.parse(event.data);
        this.onDataReceived(rawStats as SystemStats);
      } catch (err) {
        console.error("Error parsing live WebSocket data:", err);
      }
    };

    this.socket.onclose = () => {
      this.onFailoverRaised();
      this.scheduleReconnection();
    };

    this.socket.onerror = (err) => {
      console.warn("WebSocket encountered error:", err);
      this.socket?.close();
    };
  }

  private scheduleReconnection() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    // Exponential backoff capped at 10 seconds
    const delay = Math.min(this.backoffDelayMs, 10000);
    this.backoffDelayMs *= 2;

    setTimeout(() => {
      this.isReconnecting = false;
      this.connect();
    }, delay);
  }

  public disconnect() {
    this.socket?.close();
  }
}
```

---

## 4. Telemetry Source Selector (Mock vs Python Mode)

Using the administrative toggle, the platform updates how it retrieves data using either direct mock simulations or live Python endpoints:

```typescript
import { db } from './db';
import { fetchSystemPerformanceStats } from './apiAdapter';
import { generateMockPerformanceStats } from './mockAdapter';
import { SystemStats } from '../shared/telemetryContract';

export async function getActiveTelemetryStats(): Promise<SystemStats> {
  // Query IndexedDB configuration settings
  const activeMode = await db.getSetting('settings.telemetryMode') || 'MOCK';
  const selectedVersion = await db.getSetting('settings.apiVersion') || 'v1';

  if (activeMode === 'PYTHON') {
    try {
      return await fetchSystemPerformanceStats(selectedVersion);
    } catch (err) {
      console.warn("Python service unreachable, loading failsafe mocks.");
      return generateMockPerformanceStats();
    }
  }

  return generateMockPerformanceStats();
}
```
