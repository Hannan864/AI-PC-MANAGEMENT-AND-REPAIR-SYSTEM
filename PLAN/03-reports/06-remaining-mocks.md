# Remaining Mock Systems Report
**System:** System Sentinel Platform

While the core telemetry and PC builder engines are now powered by real OS data and deterministic backend scoring, the following subsystems remain mocked or simulated for safety, architectural scope, or sandbox constraints:

## 1. System Optimization (`/optimize`)
- **Reason:** For safety and stability of the user's host machine, the backend does not actually terminate processes or modify system registries.
- **Current Logic:** Simulates RAM recovery and cache purging based on process impact analysis.

## 2. Technician Operations
- **Components:** `ActiveRepairsTech`, `IncomingRequestsTech`, etc.
- **Reason:** These are multi-user workflow components. In a local-first deployment, they operate on a local IndexedDB state rather than a shared cloud database.
- **Current Logic:** Uses local `db.ts` to manage state, simulating a multi-user environment.

## 3. Alerts & History
- **Components:** `AlertsCenter`, `ReportsHistory`.
- **Reason:** Aggregation is done client-side to reduce backend overhead.
- **Current Logic:** `TelemetryAggregator` and `systemHealthMonitor` generate alerts based on incoming real data streams, but the storage of these alerts is in the browser's IndexedDB.

## 4. Hardware Updates
- **Components:** `HardwareDrivers`.
- **Reason:** Real-time driver installation/updating requires administrative privileges and complex OS-specific installers which are outside the current project scope.
- **Current Logic:** Identifies hardware accurately but "nominal" status is derived from lack of system errors rather than real driver version repository checks.

**Summary:** The core diagnostic value proposition is 100% real. The remaining mock elements are primarily related to "taking action" (Optimization/Repairs) which is a safety/architectural choice.
