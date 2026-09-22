# System Sentinel Platform — Mock-to-Real Mapping Blueprint

This document identifies all active simulation structures, mock arrays, and random loops within the System Sentinel client-side workspace. It provides the exact migration path, required Python backend endpoints, native OS libraries, schemas, and target files to transition to bare-metal integrations.

---

## 1. System Health Telemetry Engine

*   **Current Location**: `services/diagnosticProvider.ts` / `services/systemHealthMonitor.ts`
*   **Current Simulation**: Generates pseudo-random walks for CPU load (`Math.random()`), RAM margin values (50% average baseline), disk margins, temperatures, and network download/upload margins.
*   **Required Real Python Library**: 
    - `psutil` (for OS CPU counters, memory paging tables, disk space bytes, and network IO cards).
2.  **Required Backend Endpoint**: `GET /api/v1/performance` & `WS /api/v1/stream`
*   **Expected Output Schema**:
    ```json
    {
      "cpu": 24.8,
      "ram": 56.4,
      "disk": 44.2,
      "temp": 48.2,
      "networkDown": 1.84,
      "networkUp": 0.35,
      "timestamp": 1717253800000,
      "batteryLevel": 92.0,
      "isCharging": true
    }
    ```
*   **Frontend Components Using It**:
    - `components/Services/SystemHealth.tsx`
    - `components/Services/PerformanceOptimizer.tsx`

---

## 2. Storage Intelligence (Size & Duplication discovery)

*   **Current Location**: `components/Services/StorageIntelligence.tsx`
*   **Current Simulation**: Static mock records lists (`mock_files` containing cache paths, logs, overlay configurations) and random generation for duplication and stale files.
*   **Required Real Python Library**:
    - `psutil` + `pathlib` (recursively scanning custom volumes and auditing files > 50MB and tracking age parameters via standard file info tables).
*   **Required Backend Endpoint**: `GET /api/v1/storage`
*   **Expected Output Schema**:
    ```json
    {
      "files": [
        { "path": "/var/log/sys_audit.log", "size": 152003010, "lastModified": 1717253200000, "isLarge": true },
        { "path": "/usr/bin/python3", "size": 5402100, "lastModified": 1717000000000, "isLarge": false }
      ],
      "totalSize": 512110200422
    }
    ```
*   **Frontend Components Using It**:
    - `components/Services/StorageIntelligence.tsx`

---

## 3. Network Diagnostics (Latency Monitor & Network Forensics)

*   **Current Location**: `components/Services/NetworkDiagnostics.tsx`
*   **Current Simulation**: Random timing latency spikes (`Math.random() * 20` ms) and mock records list of process traffic users like "Chrome" or "NodeProcess".
*   **Required Real Python Library**:
    - `psutil.net_connections()` + parsing process names via `psutil.Process(conn.pid).name()`.
*   **Required Backend Endpoint**: `GET /api/v1/network`
*   **Expected Output Schema**:
    ```json
    {
      "latency": 18.5,
      "forensics": [
        { "name": "Chrome Browser API", "down": "1.48 MB/s", "up": "0.52 MB/s", "type": "remote" },
        { "name": "FastAPI Telemetry Streamer", "down": "0.05 MB/s", "up": "0.22 MB/s", "type": "local" }
      ]
    }
    ```
*   **Frontend Components Using It**:
    - `components/Services/NetworkDiagnostics.tsx`

---

## 4. Hardware Inventory (CPU, Motherboard, GPU Specification blocks)

*   **Current Location**: `components/Services/HardwareDrivers.tsx`
*   **Current Simulation**: Generic mock spec structures containing mock platform information.
*   **Required Real Python Library**:
    - `py-cpuinfo` (to extract brand_raw, instructions, core layout details).
    - `GPUtil` (gpus listings, vram capability stats).
    - `platform` + `socket` definitions.
*   **Required Backend Endpoint**: `GET /api/v1/hardware`
*   **Expected Output Schema**:
    ```json
    {
      "inventory": [
        { "name": "AMD Ryzen 7 7800X3D 8-Core Processor", "category": "Processor (CPU)", "status": "nominal", "version": "v14.2 (64-bit)" },
        { "name": "NVIDIA GeForce RTX 4080 Super", "category": "Graphics Processor (GPU)", "status": "nominal", "version": "Driver: 551.86 (VRAM: 16384MB)" }
      ]
    }
    ```
*   **Frontend Components Using It**:
    - `components/Services/HardwareDrivers.tsx`

---

## 5. Security Validation & Stability Event Logs

*   **Current Location**: `components/Services/SecurityStability.tsx`
*   **Current Simulation**: Pseudo-random security integrity audit states (`VERIFIED` vs `ACTIVE`) and mock historical stability event lists based on standard system logs.
*   **Required Real Python Library**:
    - Scanning socket listeners on open ports (`psutil.net_connections()`), analyzing process hashes, and querying `journalctl` (Mac/Linux syslog) or Windows Event Logs.
*   **Required Backend Endpoint**: `GET /api/v1/security`
*   **Expected Output Schema**:
    ```json
    {
      "integrity": [
        { "name": "Deep Kernel Isolation Engine", "status": "VERIFIED" },
        { "name": "Host Firewall Rules Validation", "status": "VERIFIED" }
      ],
      "events": [
        { "id": "evt_001", "label": "WebSocket link verified", "details": "Handshake complete with core driver", "timestamp": 1717253800000, "type": "amber" }
      ]
    }
    ```
*   **Frontend Components Using It**:
    - `components/Services/SecurityStability.tsx`

---

## 6. Power Insights and Charge Curves

*   **Current Location**: `components/Services/PowerInsights.tsx`
*   **Current Simulation**: Simulates decaying charge curves and capacity metrics.
*   **Required Real Python Library**:
    - `psutil.sensors_battery()` (releasing percentage, seconds left, power plugged bounds).
*   **Required Backend Endpoint**: `GET /api/v1/performance` (battery parameters included in core stats)
*   **Expected Output Schema**: Matches `SystemStatsModel` (`batteryLevel`, `isCharging`).
*   **Frontend Components Using It**:
    - `components/Services/PowerInsights.tsx`
