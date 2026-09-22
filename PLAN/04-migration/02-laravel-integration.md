# System Sentinel Platform — Backend Integration Plan

## 1. Integration Paradigm
The System Sentinel Platform employs a high-performance **FastAPI (Python 3.10+)** backend alongside a **Vite + React (TypeScript)** frontend. The backend gathers real-time hardware measurements and provides reliable telemetry data streams over high-frequency connections. It also provides traditional REST endpoints as backups when WebSockets are unavailable.

```
+-------------------------------------------------------------+
|                     TypeScript Frontend                     |
|                                                             |
|           [WebSocket]                     [REST API]        |
|  ws://localhost:5000/api/v1/stream     (Failover Mode)      |
+----------------------+---------------------------+----------+
                       |                           |
                       |                           | Handles REST / Poll
                       v                           v
+-------------------------------------------------------------+
|                     FastAPI Python Server                   |
|                                                             |
|   - WebSocket Handler                    - REST Controllers |
|   - Broadcaster Thread                   - JSON Adapters    |
+------------------------------------+------------------------+
                                     |
                                     | Employs psutil mapping
                                     v
+-------------------------------------------------------------+
|                     Local Host Machine                      |
|                                                             |
|   - Hardware Info      - Networking       - Disk / IO       |
+-------------------------------------------------------------+
```

---

## 2. API Schema Compliance (TypeScript - Python Mapping)
Frontend and backend communication adheres to the strict contract schema defined in `/shared/telemetryContract.ts`:

| Metrics Category | Python Model (Pydantic) | TypeScript Interface | Core Measurements |
| :--- | :--- | :--- | :--- |
| **System Stats** | `SystemStatsModel` | `SystemStats` | CPU %, Mem %, Temp, Disk Temp |
| **Network Metrics** | `NetworkMetricsModel` | `NetworkMetrics` | Latency, connection counts, active processes |
| **Storage Metrics**| `StorageMetricsModel` | `StorageMetrics` | File listing, partition allocations, sizes |
| **Security Metrics** | `SecurityMetrics` | `SecurityMetrics` | Firewall, kernel signatures, active processes |
| **Hardware Specs**| `HardwareInventory` | `HardwareMetrics` | Model numbers, hardware categories, versions |

---

## 3. Python Endpoint Specifications

### 3.1 Host Connectivity Health Verification
Checks the status of the local Python service and its diagnostic adapters.
* **Route**: `/api/v1/health`
* **Method**: `GET`
* **Response Signature**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": 1717253825,
  "telemetry_source": "system_sentinel_probe"
}
```

### 3.2 Live Performance Snapshot Telemetry
Returns current OS thread workloads, core allocation states, and active memory pools.
* **Route**: `/api/v1/performance`
* **Method**: `GET`
* **Response Signature**:
```json
{
  "cpu": 32.4,
  "ram": 68.1,
  "temp": 52,
  "timestamp": 1717253828
}
```

### 3.3 Storage Partition & File Analyzer
Monitors active partitions, disk layouts, and provides deep scans of large files.
* **Route**: `/api/v1/storage`
* **Method**: `GET`
* **Response Signature**:
```json
{
  "totalSize": 512110200422,
  "files": [
    { "path": "/Users/Sentinel/Logs/sys_audit.log", "size": 152003010, "lastModified": 1717251100, "isLarge": true },
    { "path": "/Users/Sentinel/Cache/temp_store.bin", "size": 890040, "lastModified": 1717253000, "isLarge": false }
  ]
}
```

### 3.4 Live Traffic & Latency Forensic Analyzer
Analyzes round-trip network performance and identifies bandwidth-heavy socket connections.
* **Route**: `/api/v1/network`
* **Method**: `GET`
* **Response Signature**:
```json
{
  "latency": 24.3,
  "forensics": [
    { "name": "Chrome Network Thread", "down": "14.2 MB/s", "up": "1.1 MB/s", "type": "remote" },
    { "name": "FastAPI Streamer", "down": "0.1 MB/s", "up": "0.3 MB/s", "type": "local" }
  ]
}
```

### 3.5 System Hardware Profiler
Returns hardware system specifications and checks the status of main devices.
* **Route**: `/api/v1/hardware`
* **Method**: `GET`
* **Response Signature**:
```json
{
  "inventory": [
    { "name": "Intel Core i7-12700H", "category": "Processor", "status": "nominal", "version": "v12.2" },
    { "name": "NVIDIA GeForce RTX 3060", "category": "Graphics Card", "status": "nominal", "version": "driver v535.12" }
  ]
}
```

---

## 4. `psutil` System Data Collection Strategy
The backend uses Python's library `psutil` to retrieve accurate measurements directly from the host operating system:

```python
import psutil
import time
from typing import Dict, Any

def gather_system_metrics() -> Dict[str, Any]:
    # Calculate CPU utilization (sampled over a 150ms interval)
    cpu_usage = psutil.cpu_percent(interval=0.15)
    
    # Retrieve system memory (RAM) allocation details
    virtual_mem = psutil.virtual_memory()
    ram_usage = virtual_mem.percent
    
    # Retrieve disk partition storage details
    disk_usage = psutil.disk_usage('/')
    disk_percent = disk_usage.percent
    
    # Estimate system core temperatures 
    temperatures = psutil.sensors_temperatures()
    core_temp = 42  # Baseline temperature
    if 'coretemp' in temperatures:
        core_temp = int(temperatures['coretemp'][0].current)
    
    # Retrieve networking performance statistics
    net_io = psutil.net_io_counters()
    
    return {
        "cpu": cpu_usage,
        "ram": ram_usage,
        "disk": disk_percent,
        "temp": core_temp,
        "networkDown": round(net_io.bytes_recv / 1024, 2),  # Kilobytes received
        "networkUp": round(net_io.bytes_sent / 1024, 2),    # Kilobytes sent
        "timestamp": int(time.time() * 1000)
    }
```

---

## 5. Failover Streaming Protocol
1. **WebSocket Connection**: The frontend `WebSocketManager` initiates a connection to `ws://localhost:5000/api/v1/stream`.
2. **Streaming loop**: The server continuously pushes real-time system metrics down the socket channel at a standard 1.5-second rate.
3. **Heartbeat monitoring**: Active connections use a ping-pong routine to check signal status.
4. **Graceful recovery**: If a connection fails, the client uses exponential backoff to attempt reconnecting while automatically switching to REST backup polling (hitting `/api/v1/*` endpoints) to maintain real-time UI views without dropping data.
