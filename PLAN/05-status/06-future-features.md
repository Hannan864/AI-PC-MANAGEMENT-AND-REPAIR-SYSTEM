# System Sentinel Platform — Future Features Backlog

This log serves as the development roadmap, separating features by graduation, product launch, and commercial expansion.

---

## Phase 1 — Near Term: Required for University Graduation (FYP)

### Consolidated Multi-Node Network Testing
*   **Goal**: Allow a single administrator to coordinate and run active diagnostic tests (such as disk checks or memory purges) on multiple connected remote client terminals.
*   **Requirements**: FastAPI WebSocket broadcasting layer that can coordinate actions across multiple active socket pools simultaneously.

### Expanded Security Breach Sandbox Tracking
*   **Goal**: Detect system changes (such as unauthorized port alterations or suspicious task names) and trigger visual breach alerts on the administrator's dashboard.
*   **Requirements**: Python `psutil.net_connections()` combined with local system registry checklists.

---

## Phase 2 — Mid Term: Required for Production Launch

### Centralized SQL Server Storage Matrix
*   **Goal**: Coordinate and back up local client logs (`SentinelDB` databases) to a central cloud server.
*   **Requirements**: Integrate dynamic syncing between the client IndexedDB and a central PostgreSQL database.

### Real Parts Pricing & Stock API Scraper
*   **Goal**: Replace pre-indexed spare parts lists with dynamic, real-time market pricing.
*   **Requirements**: Setup background scraping tasks in `/backend/main.py` using Beautiful Soup to pool pricing info from local hardware vendor catalogs.

---

## Phase 3 — Long Term: Commercial SaaS Scaling

### Automated Hardware Maintenance Actions
*   **Goal**: Enable administrators to trigger automated system cleanups (such as clearing temp files or managing startup schedules) on remote workstations with one click.
*   **Requirements**: Direct API integration with local administrative controls on host platforms.

### Intelligent AI Configuration Adviser (APCIE)
*   **Goal**: Provide automated, personalized system build recommendations based on a user's target budget, favorite games, or primary workloads.
*   **Requirements**: Structured Gemini AI suggestions paired with dynamic stock indices.
