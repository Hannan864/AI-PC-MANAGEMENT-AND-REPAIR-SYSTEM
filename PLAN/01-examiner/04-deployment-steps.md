# System Sentinel Platform — Export & Handoff Handbook

Welcome, Incoming Developer or AI Agent! This package serves as the final architecture handoff and checklist for the System Sentinel Platform.

---

## 1. Primary Files Directory Map

When continuing development or deploying the system, prioritize reviewing these core files first:

| Target File / Path | Core System Purpose | Focus Checklist |
| :--- | :--- | :--- |
| `/PLAN/blueprint.md` | Single Source of Truth for Project Architecture. | Review global layouts and technical structures. |
| `/PLAN/ai_instructions_for_backend.md` | Extensive step-by-step setup guide for the FastAPI Python server. | Use this file to set up the backend environment. |
| `/backend/main.py` | Complete single-file Python FastAPI server. | Contains sensor diagnostics, REST routing, and streaming loops. |
| `/services/db.ts` | Persistent database wrapper (SentinelDB IndexedDB v10). | Inspect table structures and data relations. |
| `/services/pcBuilder.ts` | Compatibility checking and suitability score math for the custom PC builder (APCIE). | Dynamic socket matching, form factor, and PSU headroom validation. |
| `/components/Services/user/BuildPlanner.tsx` | Front-end shell layout component for the PC builder (APCIE). | Clean user interaction and parts checklists. |

---

## 2. Shared Integration Data Contracts

### 2.1 Raw Telemetry Stream Contracts
The Python WebSocket must stream data to `ws://localhost:5000/api/v1/stream` matching the following template structures:

```json
{
  "cpu": 18.25,
  "ram": 52.40,
  "disk": 41.20,
  "temp": 46.50,
  "networkDown": 1.48,
  "networkUp": 0.52,
  "timestamp": 1717253800000,
  "batteryLevel": 85.00,
  "isCharging": true
}
```

### 2.2 Persistent Local Relational Database Tables
*   `metrics`: Sliding-window metrics histories.
*   `logs`: Audit logs and system error registers.
*   `settings`: Dynamic client parameters.
*   `repair_requests`: SLA-based support tickets.
*   `pc_builds`: User hardware configurations and performance scores.

---

## 3. High Frequency WebSockets Flow Chart

1.  **Frontend dials the socket** `ws://localhost:5000/api/v1/stream`.
2.  **FastAPI establishes the handshake** and initializes resource threads.
3.  **Active loops stream updates** to the client every **1.5 seconds**.
4.  If the frontend detects a connection drop, it logs the event in security log arrays, starts an **exponential backoff recovery sequence**, and switches seamlessly to **simulated safety curves** to preserve dashboard usability.
