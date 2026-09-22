# System Sentinel Platform — Future AI Developer Handoff Package

This handoff guide contains the system status, file structures, schemas, and instructions necessary for a subsequent Dev Agent or AI assistant to continue development of the System Sentinel Platform.

---

## 1. Core Project Identification

*   **Applet ID**: `35ede1c1-fa74-4a0d-ae1b-abfd15f2e6ea`
*   **Aesthetic Tone**: Deep Twilight Slate Dark theme with indigo and emerald accents.
*   **Database Engine**: SentinelDB (IndexedDB v10 Local Store) + Dual React Provider.
*   **Target Backend**: Python FastAPI Server running on local port `5000` (bridged via WebSockets).

---

## 2. Completed vs. Incomplete Tasks Checklist

### Frontend Checklist
*   [x] Decompose `BuildPlanner.tsx` into modular components (`BuildScorePanel.tsx`, `BuildSuggestionsPanel.tsx`, `BuildCard.tsx`) to fall cleanly below the 300 lines limit.
*   [x] Build the sliding-window metrics decimation aggregator (5s and 30s averages memory cache).
*   [x] Build the technician invoicing, service gig boards, and active ticketing history log.
*   [x] Implement the Administration portal with override controls, SLA indicators, and reassignments.
*   [x] Implement the Gemini-powered intelligent diagnostic triage engine with reliable simulated fallbacks.

### Backend Tasks Checklist
*   [x] Blueprint out `/backend/main.py` (complete single-file server structure).
*   [x] Implement genuine OS telemetry loops utilizing python `psutil`, `GPUtil`, and `py-cpuinfo` sensors.
*   [x] Implement standard CORS policy permissions enabling connections from any origin.
*   [ ] Integration Step: Toggle the client's mode within the front-end Administration portal to establish connection bounds with the FastAPI server on port `5000`.

---

## 3. Recommended Development Flow & Deployment Order

### Step 1: Initialize the Python Workspace
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```
*Verify that the health check responds correctly at `http://localhost:5000/api/v1/health`.*

### Step 2: Establish the Frontend Telemetry Connection
1.  Launch the React client-side applet on `http://localhost:3000`.
2.  Navigate to the **Administrative Hub** from the sidebar.
3.  Locate the **Telemetry Mode Selector** and select:
    `Python Backend Stream API (PORT: 5000)`.
4.  Open the browser console and verify that the WebSocket successfully connects to `ws://localhost:5000/api/v1/stream`, receiving 1.5-second JSON metrics payloads and responding with handshake pongs.

---

## 4. Expected Folder Taxonomy Overview

```text
/ (Workspace Root)
│
├── PLAN/                             # Master Documentation & Plans
│   ├── blueprint.md                  # Comprehensive Single Source of Truth
│   ├── fyp_final_report.md           # University-ready dissertation report
│   ├── project_structure.md          # File mapping tree
│   ├── final_architecture_audit.md   # Architectural debt and gaps review
│   ├── mock_to_real_mapping.md       # Standard simulation API boundaries
│   ├── pc_builder_gap_analysis.md    # APCIE hardware checker evaluation
│   ├── fyp_compliance_report.md      # CS Degree validation scorecard
│   └── next_ai_handoff.md            # Active file (THIS ONE)
│
├── services/                         # Shared Core Providers
│   ├── db.ts                         # SentinelDB storage adapter
│   ├── pcBuilder.ts                  # Compatibility rules calculations
│   └── pcComponents.ts               # Hardware catalog entries
│
└── components/Services/user/         # Modular APCIE UI Dashboard
    ├── BuildPlanner.tsx              # Main builder shell component
    ├── BuildScorePanel.tsx           # Component detailing pricing & voltages
    └── BuildSuggestionsPanel.tsx     # APCIE smart replacement part advisor
```
