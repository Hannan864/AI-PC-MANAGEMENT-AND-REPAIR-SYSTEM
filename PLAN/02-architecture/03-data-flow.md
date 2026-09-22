# System Sentinel Platform — Data Flow Architecture Plan

This document illustrates the end-to-end data pipelines, system sequencings, and automated diagnostic triage loops of the **System Sentinel Platform**.

---

## 1. System Sequencing Diagram

```
+------------+             +-----------------+             +------------------+             +---------------+             +------------+
| CLIENT UI  |             |  STREAM MANAGER |             | TELEMETRY QUEUE  |             |  FASTAPI API  |             | OS SENSORS |
+-----+------+             +--------+--------+             +--------+---------+             +-------+-------+             +-----+------+
      |                             |                               |                               |                             |
      | 1. Subscribe()              |                               |                               |                             |
      +============================>|                               |                               |                             |
      |                             | 2. Connect() [WS / REST Port] |                               |                             |
      |                             +==============================>|                               |                             |
      |                             |                               | 3. Query system metrics       |                             |
      |                             |                               +============================>|                             |
      |                             |                               |                               | 4. Fetch metrics            |
      |                             |                               |                               +============================>|
      |                             |                               |                               |                             |
      |                             |                               |                               | 5. Return live bytes        |
      |                             |                               |                               |<----------------------------+
      |                             |                               | 6. Format JSON telemetry      |                             |
      |                             |                               |<------------------------------+                             |
      |                             | 7. Aggregate data & decimate  |                               |                             |
      |                             |<------------------------------+                               |                             |
      | 8. Refresh dashboard views  |                               |                               |                             |
      |<----------------------------+                               |                               |                             |
      |                             |                               |                               |                             |
```

---

## 2. Advanced Incident Response and Triage Loop

The diagram below details the autonomous loop that identifies system errors, coordinates technician support, and tracks job resolution steps.

```
                  +----------------------------------------------+
                  |         Diagnostic Client Scan               |
                  |  - High disk usage / memory saturation       |
                  +----------------------+-----------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |         Auto-Triage Generation               |
                  |  - Formulate JSON state logs                |
                  |  - Query local support databases             |
                  +----------------------+-----------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |         AI Routing Advisor                   |
                  |  - Assess issue severity                     |
                  |  - Suggest targeted troubleshooting          |
                  +----------------------+-----------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |         Interactive Marketplace Job          |
                  |  - User submits ticket with hardware logs    |
                  |  - Select pre-configured support gigs       |
                  +----------------------+-----------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |         Technician Operations & SLA          |
                  |  - Track job milestone updates               |
                  |  - Order parts and build custom components   |
                  +----------------------+-----------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |         Billing & Audit Settlement           |
                  |  - Auto-convert USD material bills to PKR    |
                  |  - Complete work and save repair audit logs  |
                  +----------------------------------------------+
```

---

## 3. Telemetry Snapshot & Shared Diagnostics

* **Diagnostic JSON format**: Telemetry reports save to the local IndexedDB database using a strict JSON format.
* **Service integration**: This structured format ensures remote technicians receive clean hardware data without manual explanations.
* **Activity log**: Every diagnostic action, optimization routine, and build change is recorded in a local activity history log for easy auditing.
