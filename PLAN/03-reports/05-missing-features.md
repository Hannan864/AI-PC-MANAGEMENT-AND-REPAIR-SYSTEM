# System Sentinel Platform — Missing Real Implementations & Back-End Gaps

This document identifies every remaining simulation, mock container, or placeholder in the System Sentinel workspace. It serves as a checklist for transitioning toward a bare-metal Python-connected solution.

---

## 1. System Telemetry & Aggregation Sensors

### CPU, Memory, & Charging Metrics
*   **Current State**: Simulated (Random walk generators in `diagnosticProvider.ts`).
*   **Why it is Simulated**: To ensure fluid, persistent dashboards inside the sandboxed development workspace where browser APIs cannot access local processor statistics.
*   **Frontend Files Using It**: 
    - `components/Services/HealthIntelligence.tsx`
    - `components/Services/PerformanceOptimizer.tsx`
    - `components/Services/PowerInsights.tsx`
*   **Backend Requirement**: Streaming WebSocket thread at `WS /api/v1/stream` + REST endpoint at `GET /api/v1/performance`.
*   **Python Library Needed**: `psutil` (specifically `psutil.cpu_percent()`, `psutil.virtual_memory()`, and `psutil.sensors_battery()`).
*   **Estimated Implementation Complexity**: **Easy**

### Graphics Unit (GPU) Telemetry
*   **Current State**: Simulated (Constant fallback values or static parameters).
*   **Why it is Simulated**: Hardware GPU drivers (`GPUtil` or NVML) are rarely exposed in cloud sandbox platforms.
*   **Frontend Files Using It**:
    - `components/Services/HardwareDrivers.tsx`
*   **Backend Requirement**: REST endpoint at `GET /api/v1/performance` matching the contract schema.
*   **Python Library Needed**: `GPUtil` (GPU details scraping framework) or `py-cpuinfo`.
*   **Estimated Implementation Complexity**: **Easy-Medium** (requires system CUDA drivers present).

---

## 2. Directory Scanners & Disk Analysis

### Large File Scanner & Duplicate Identifier
*   **Current State**: Simulated (Static array files containing mock log directories inside `StorageIntelligence.tsx`).
*   **Why it is Simulated**: Web browsers do not have authorization to scan a user's entire machine directory tree.
*   **Frontend Files Using It**:
    - `components/Services/StorageIntelligence.tsx`
*   **Backend Requirement**: REST endpoint at `GET /api/v1/storage`.
*   **Python Library Needed**: Python's native `os`, `pathlib`, and `glob`.
*   **Estimated Implementation Complexity**: **Medium** (requires indexing files in background threads with security barriers).

---

## 3. Network Forensics & Latency Measuring

### Real Host Connection Analyzer
*   **Current State**: Simulated (Static list matching common browser and back-end processes).
*   **Why it is Simulated**: Sandbox environments restrict socket auditing commands at the OS level.
*   **Frontend Files Using It**:
    - `components/Services/NetworkDiagnostics.tsx`
*   **Backend Requirement**: REST endpoint at `GET /api/v1/network`.
*   **Python Library Needed**: `psutil.net_connections()` + parsing process PID structures.
*   **Estimated Implementation Complexity**: **Medium**

---

## 4. Live Global Pricing Scraper (APCIE PC Builder)

### Live Computer Parts Aggregation
*   **Current State**: Simulated / Pre-Indexed static database (Inside `pcComponents.ts`).
*   **Why it is Simulated**: Running complex scrape patterns dynamically on the frontend can lead to CORS blockages or rate-limiting.
*   **Frontend Files Using It**:
    - `components/Services/user/BuildPlanner.tsx`
*   **Backend Requirement**: Custom scraping API route.
*   **Python Library Needed**: `beautifulsoup4` or `playwright`.
*   **Estimated Implementation Complexity**: **High** (dynamic vendor APIs and page layouts change frequently).
