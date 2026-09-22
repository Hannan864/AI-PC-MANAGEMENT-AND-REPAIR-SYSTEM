# System Sentinel Platform — Front-to-Back Integration Mapping

This reference table maps every core React diagnostic and service component directly to its corresponding FastAPI REST/WS endpoints, business logic functions, Python libraries, and contract schemas.

---

## Unified Integration Routing Table

| Frontend Component | Target API Endpoint | Python Handler Function | Native Python Library | Contract Response Schema |
| :--- | :--- | :--- | :--- | :--- |
| **SystemHealth** | `GET /api/v1/performance` | `get_system_performance()` | `psutil` | `SystemStatsModel` |
| **SystemHealth (WS)** | `WS /api/v1/stream` | `telemetry_stream_handler()` | `psutil` + `asyncio` | Streaming stats chunks + ping/pong |
| **HardwareDrivers** | `GET /api/v1/hardware` | `get_hardware_inventory()` | `py-cpuinfo` + `GPUtil` | `HardwareInventoryModel` |
| **SecurityStability** | `GET /api/v1/security` | `get_security_and_stability_audits()` | `psutil` + processes audit | `SecurityMetricsModel` |
| **NetworkDiagnostics** | `GET /api/v1/network` | `get_network_forensics()` | `psutil.net_connections()` | `NetworkMetricsModel` |
| **PowerInsights** | `GET /api/v1/performance` | `get_system_performance()` | `psutil.sensors_battery()` | System battery stats |
| **StorageIntelligence** | `GET /api/v1/storage` | `get_storage_diagnostics()` | `psutil` + `pathlib` | `StorageMetricsModel` |
| **Ad-hoc AI Advisor** | `/api/v1/ai/triage` *(Future)* | `generate_triage_insights()` | `@google/genai` | Triage advice text block |
| **APCIE Parts Price** | `/api/v1/scraper/prices` *(Future)* | `scrape_hardware_vendor()` | `beautifulsoup4` | Live component listing rates |

---

## Telemetry Aggregator Processing Flow

Once raw data hits the React client via the stream, it is processed as follows:

```text
  [Active Python Socket Stream]
               │   (Pushes values every 1.5 seconds)
               ▼
   [telemetryStreamManager.ts]
               │   (Translates WebSocket payloads)
               ▼
   [telemetryAggregator.ts]
               │   (Calculates sliding window metrics in-memory)
               ├── 5-Second Short Window (High velocity charts and indicators)
               └── 30-Second Extended Window (General historical stability plots)
               ▼
     [systemHealthMonitor.ts]
               │   (Evaluates overall score from 0 to 100 based on resource strain)
               ▼
      [SystemHealth.tsx UI]
```
