# System Sentinel Platform — Production Blueprint & Systems Mapping

## 1. System Overview
The **System Sentinel Platform** is an enterprise-grade hardware telemetry diagnostics manager, desktop operations board, and support routing marketplace. Combining React 18 and IndexedDB (SentinelDB v10) with an integrated **Python FastAPI** telemetry stream connection on port `5000`, the platform provides users, technicians, and administrators with clear remote diagnostics, automated SLA maintenance dispatch systems, and an advanced **Advanced PC Builder Intelligence Engine (APCIE)**.

---

## 2. Technical Stack & UI Design Patterns
*   **Frontend UI Engine**: React 18+ (Vite) with dual, responsive routing contexts matching user roles.
*   **Database Engine**: SentinelDB (IndexedDB v10 Relational wrapper) ensuring resilient, offline-first client-side data persistence.
*   **Visual Style**: Clean "deep twilight dark glass" aesthetic featuring background cards, neon indigo metrics accents, and clear status indicators.
*   **Diagnostic Visualization**: Custom Recharts layout tracking live system performance data and active workload suitability parameters.
*   **Automated Diagnostics**: @google/genai module integration for compiling detailed, explainable repair strategies.

---

## 3. Global Architecture Schema

```text
                                  +-----------------------------+
                                  |     User App / Interface     |
                                  +--------------+--------------+
                                                 |
                       +-------------------------+-------------------------+
                       |                                                   |
        +--------------v--------------+                     +--------------v--------------+
        |   WebSocketManager (Stream) |                     |  DiagnosticProvider (Poll)  |
        | ws://localhost:5000/stream  |                     |  Failover Backup Poll Engine|
        +--------------+--------------+                     +--------------+--------------+
                       |                                                   |
                       +-------------------------+-------------------------+
                                                 |
                                                 v
                                  +-----------------------------+
                                  |    TelemetryAggregator      |
                                  | (Decimation/Sliding Windows)|
                                  +--------------+--------------+
                                                 |
                                                 v
                                  +-----------------------------+
                                  |    SystemHealthMonitor      |
                                  |  (Explainable Health Score) |
                                  +--------------+--------------+
                                                 |
                                                 v
                                  +--------------+--------------+
                                  |          IndexedDB          |
                                  |       (SentinelDB v10)      |
                                  +-----------------------------+
```

---

## 4. Completed Systems (Online Modules)

### 4.1 SentinelDB Relational Database Layout (v10 Database Lock)
*   **Table Matrices**: Custom Object stores for performance logs, action logs, support requests, and user build specifications.
*   **Status**: Complete, operational, and persistent across browser page reloads.

### 4.2 Advanced PC Builder Intelligence Engine (APCIE)
Decomposed into clean modular panels (meeting the 300 lines size limit):
*   **BuildPlanner**: Main container and parts selection interface.
*   **BuildScorePanel**: Displays detailed compatibility scores, estimated prices, suitability vectors, and safety power reserve ratings.
*   **BuildSuggestionsPanel**: Suggests compatible alternative components to replace mismatched parts automatically.
*   **Socket Compatibility Rules**: Verifis socket matches (AM5 vs AM4 vs LGA1700 pin matrices). Rejects invalid pairings instantly.
*   **Memory Integration Checks**: Prevents mixing DDR5 and DDR4 formats across RAM and Motherboards.
*   **PSU Power Calculator**: Sums custom TDP rails (with dynamic safety margins) and alerts users if the power supply is insufficient.
*   **Form Factor clearance checks**: Verifies ATX motherboards match suitable tower cases.
*   **Status**: Complete, optimized, and fully standalone in the browser.

### 4.3 Support & Repair Dispatch Marketplace
*   **Dispatch SLAs**: Track issues through support lifecycle phases (Submitted, Assigned, Completed, Archived).
*   **Technician Roles**: Allows specialists to claim active tickets, generate itemized bills, and update SLA status timelines.
*   **Executive Admin Panels**: Overrides priority flags and analyzes technician queues and active capacities.
*   **Status**: Complete, operational, and linked to IndexedDB.

---

## 5. Mock Systems & Live Failover Safe Loops

*   **Offline Mode**: Generates realistic simulated telemetry data to keep the dashboard responsive and user-friendly if the Python backend is disconnected.
*   **Auto-Reconnection**: Reconnects to the backend via an exponential backoff sequence (`1s -> 2s -> 5s -> 10s max delay`). Logs dropouts to safety registers to ensure a seamless recovery process.

---

## 6. Planned Python FastAPI Stream Integration

*   **Port Setup**: FastAPI REST & WS instances bind to port `5000` (`http://localhost:5000`).
*   **Active Route Streams**:
    -   `GET /api/v1/health`
    -   `GET /api/v1/performance` (REST Fallback Polling)
    -   `GET /api/v1/storage` (System directory scans)
    -   `WS /api/v1/stream` (High-frequency server analytics)
*   **Telemetry Stream Contract**: Sends real-time system stats (CPU, memory, disk, network flows, and battery) to the client dashboard.
