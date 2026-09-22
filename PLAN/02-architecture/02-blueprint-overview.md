# System Sentinel Platform — Enterprise Architecture Blueprint Overview

This document describes the high-level architecture of the **System Sentinel Platform**, detailing the multi-portal structure, dual telemetry stream adapters, and frontend-to-backend system integration layers.

---

## 1. High-Level Architectural Diagram

```
                                 +---------------------------------------+
                                 |         System Sentinel Client        |
                                 |     (React SPA + Tailwind CSS viewport) |
                                 +-------------------+-------------------+
                                                     |
                                                     v
                                 +-------------------+-------------------+
                                 |         Workspace Router Controller   |
                                 +--------+----------+----------+--------+
                                          |          |          |
                      +-------------------+          |          +-------------------+
                      |                              |                              |
         +------------v------------+    +------------v------------+    +------------v------------+
         |      User Workspace     |    |    Technician Portal    |    |   Administrative Hub   |
         |                         |    |                         |    |                         |
         |  - Diagnostics Panels   |    |  - Accepted Gigs Board  |    |  - Live Health Scores   |
         |  - PC Build Planner     |    |  - SLA Live Trackers     |    |  - System Performance   |
         |  - Active Service Gigs  |    |  - PKR Receipts Dispatch |    |  - Triage Overrides     |
         +------------+------------+    +------------+------------+    +------------+------------+
                      |                              |                              |
                      +------------------------------+------------------------------+
                                                     |
                                                     v
                                 +-------------------+-------------------+
                                 |       Telemetry Pipeline Gateway      |
                                 |       (Active Mock / Python Toggle)   |
                                 +--------+---------------------+--------+
                                          |                     |
                      +-------------------+                     +-------------------+
                      |                                                             |
         +------------v------------+                                   +------------v------------+
         |     WebSocket Manager   | (Real-time Stream)                |    Diagnostic Provider  | (REST Failover Polling)
         |   ws://localhost:5000   | <===============================> |    http://localhost:5000|
         +-------------------------+                                   +-------------------------+
```

---

## 2. Operational Portals (Separation of Concerns)

To maintain clean operational boundaries and secure workspace control, the application divides user interactions into three isolated roles:

### 2.1 User Portal (Workspace Client)
* **Real-Time Client Diagnostics**: Renders resource graphs tracking CPU thread cycles, RAM saturation, and localized thermal readings.
* **Component Assembler**: Focuses on PC build setups, analyzing component pins and DDR specifications to prevent layout misalignments.
* **Service Center**: Users list diagnostic summaries, purchase customized support gigs, and track SLA milestones in real time.

### 2.2 Technician Portal (Provider Client)
* **Accepted Gigs Board**: Technicians accept repair jobs, view diagnostic logs, and update job stages (e.g. `ACCEPTED`, `INFO_REQUESTED`, `Repair Working`).
* **Milestone Dispatch**: Real-time SLA indicators track estimated completion times.
* **PKR Invoice Generator**: Automatically computes parts, hardware additions, and labor fees into PKR with a static exchange rate ledger.

### 2.3 Admin Portal (Platform Monitor)
* **Global Health Dashboard**: Displays the 0-100 graded health index with detailed explanations for each metric.
* **Active Stream Controls**: Allows administrators to toggle between `Mock` and `Python` telemetry sources.
* **Triage Override**: Enables administrators to adjust ticket priorities, override statuses, or reassign jobs to different technicians.

---

## 3. Data Flow and Database Infrastructure

The client operates on an **offline-first pattern** utilizing **IndexedDB** (`SentinelDB`) to cache and store data locally:

1. **Local Writes**: User updates (such as saving custom PC configurations or submitting repair tickets) write directly to the local IndexedDB.
2. **Telemetry Aggregator**: High-frequency metrics pass through the aggregator to calculate 5-second and 30-second sliding averages.
3. **Adaptive Sampler**: The aggregator decimates incoming snapshots into 15-second saves. It overrides this interval and saves immediately if a metrics spike exceeding 15% is detected.
4. **Synchronization**: When the backend connection is active, buffered records in the local queue sync automatically with the cloud API.
