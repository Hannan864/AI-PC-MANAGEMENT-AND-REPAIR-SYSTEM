# System Sentinel Platform — Backend Python Plan (FastAPI)

This planning document outlines the design and implementation steps for building the **FastAPI (Python 3.10+)** backend telemetry server. It details how the backend integrates with low-level OS sensors using Python packages and supports real-time dual-mode data streams.

---

## 1. FastAPI Project Folder Layout

To keep code modular and maintainable, organize the Python backend into clear, decoupled files:

```
/backend/
│
├── main.py                    # Server config, routes, CORS directives, and WS handler
├── requirements.txt           # Required Python packages
│
├── core/
│   ├── __init__.py
│   ├── config.py              # Environment variables and port configurations
│   └── security.py            # Local process verification
│
├── models/
│   ├── __init__.py
│   └── telemetry.py           # Pydantic data schemas matching TypeScript contracts
│
└── services/
    ├── __init__.py
    ├── cpu_service.py         # Thread utilization and clock speeds via psutil
    ├── gpu_service.py         # GPU utilization and memory loads via GPUtil
    ├── disk_service.py        # Storage listings and partition capacities
    └── network_service.py     # Port scans and telemetry throughput calculation
```

---

## 2. API Endpoint Specifications

The Python backend must implement the following REST routes and WebSocket channels to support real-time data streaming on the client:

| Metric Category | Route | Method | Python Schema | Core OS Sensor Library |
| :--- | :--- | :--- | :--- | :--- |
| **Connectivity** | `/api/v1/health` | `GET` | — | FastAPI Status Checker |
| **V2 Connectivity** | `/api/v2/health` | `GET` | — | FastAPI Status Checker |
| **System Stats** | `/api/v1/performance` | `GET` | `SystemStatsModel` | `psutil` + `py-cpuinfo` |
| **Storage Alloc**| `/api/v1/storage` | `GET` | `StorageMetricsModel` | `psutil` + `pySMART` (Optional) |
| **Traffic Audit**| `/api/v1/network` | `GET` | `NetworkMetricsModel` | `psutil` Network Counters |
| **Hardware Specs**| `/api/v1/hardware` | `GET` | `HardwareInventoryModel`| `py-cpuinfo` / `GPUtil` |
| **Process Security**| `/api/v1/security` | `GET` | `SecurityMetricsModel` | `psutil` process info |
| **WebSockets**   | `/api/v1/stream` | `WS` | JSON pushes | FastAPI WebSocket Loop |

---

## 3. Python OS Library Mappings

* **`psutil`** (Process and System Utilities):
  Collects core system measurements, including CPU utilization, RAM saturation, active system partitions, network traffic stats, and active system processes.
* **`GPUtil`** (GPU Discovery):
  Identifies active graphics cards (such as NVIDIA GPUs) and reads load statistics like core utilization, temperature, and VRAM levels.
* **`py-cpuinfo`**:
  Retrieves hardware technical specifications, including manufacturer, model name, base clock speeds, and active L2/L3 instruction cache limits.
* **`wmi`** (Windows Management Instrumentation / Windows OS optional alternate):
  Queries motherboards, RAM layouts, fan speeds, and driver registration codes in Windows environments.

---

## 4. Telemetry Collection Logic Example

```python
import psutil
import time
from typing import Dict, Any

def collect_host_performance_metrics() -> Dict[str, Any]:
    """
    Retrieves real-time system performance metrics from the host operating system.
    """
    # Sample CPU utilization over a 150ms interval
    cpu_usage_pct = psutil.cpu_percent(interval=0.15)
    
    # Retrieve system memory (RAM) allocation details
    memory_info = psutil.virtual_memory()
    ram_usage_pct = memory_info.percent
    
    # Check root system partition capacity
    disk_info = psutil.disk_usage('/')
    disk_usage_pct = disk_info.percent
    
    # Parse core temperatures with standard fallback values
    temperature_c = 42.0
    if hasattr(psutil, "sensors_temperatures"):
        temps = psutil.sensors_temperatures()
        if "coretemp" in temps:
            temperature_c = float(temps["coretemp"][0].current)
            
    # Calculate total network bytes received and sent
    net_io = psutil.net_io_counters()
    net_down_mb = round(net_io.bytes_recv / (1024 * 1024), 2)
    net_up_mb = round(net_io.bytes_sent / (1024 * 1024), 2)
    
    return {
        "cpu": cpu_usage_pct,
        "ram": ram_usage_pct,
        "disk": disk_usage_pct,
        "temp": temperature_c,
        "networkDown": net_down_mb,
        "networkUp": net_up_mb,
        "timestamp": int(time.time() * 1000)
    }
```

---

## 5. Failover Mocks for Restrictive Sandboxes

To ensure the backend server runs reliably in isolated environments, sandboxes, or containers where low-level OS drivers are blocked, the server must automatically load mock data generators if system readings fail:

```python
import random
import logging

logger = logging.getLogger("SystemSentinelBackend")

def generate_failover_metrics() -> Dict[str, Any]:
    """
    Generates realistic system metrics if hardware drivers are unavailable.
    """
    logger.warning("OS sensors unavailable. Utilizing secure failover simulation mode.")
    return {
        "cpu": round(random.uniform(5.0, 35.0), 1),
        "ram": round(random.uniform(30.0, 55.0), 1),
        "disk": 41.2,
        "temp": round(random.uniform(35.0, 48.0), 1),
        "networkDown": round(random.uniform(0.5, 4.2), 2),
        "networkUp": round(random.uniform(0.1, 1.5), 2),
        "timestamp": int(time.time() * 1000)
    }
```
