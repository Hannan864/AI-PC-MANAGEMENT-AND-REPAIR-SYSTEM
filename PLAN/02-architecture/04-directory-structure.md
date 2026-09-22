# System Sentinel Platform — Project Structure

Below is the directory tree of the System Sentinel Platform workspace, organized into front-end components, shared contracts, data services, and back-end integration entry points.

```
/ (Workspace Root)
├── package.json                     # Dynamic build configuration and scripts
├── vite.config.ts                   # Vite bundler, proxy and development settings
├── tsconfig.json                    # Strict compiler rules & path decorations
├── tailwind.config.js               # UI aesthetic theme mappings & custom palettes
├── index.html                       # Entry client viewport mounting node
├── index.tsx                        # Global runtime injector
├── App.tsx                          # App viewport layout switcher, authentication & routing
├── types.ts                         # System types and state contracts
├── constants.tsx                    # Static SVG icon vectors, color layouts, configurations
│
├── PLAN/                            # COMPLETE PLANNING + ARCHITECTURE MASTER BLUEPRINT
│   ├── blueprint.md                 # Master production system blueprint
│   ├── fyp_final_report.md          # University-ready Final Year Project (FYP) dissertation report
│   ├── project_structure.md         # ZIP-ready full project structure overview
│   ├── backend_integration_plan.md # FastAPI python integration blueprint
│   ├── blueprint_overview.md        # Full platform architecture mapping
│   ├── backend_python_plan.md       # Detailed FastAPI backend design & Python models
│   ├── frontend_backend_connection.md # Flow interface and WebSocket lifecycle
│   ├── data_flow_architecture.md    # Sequencings and triage loops
│   ├── ai_instructions_for_backend.md # Extensive step-by-step action guide for the developer/AI
│   ├── final_architecture_audit.md  # Brutally detailed architecture audit & gap review
│   ├── mock_to_real_mapping.md      # Precision mapping of simulated loops to genuine Python APIs
│   ├── pc_builder_gap_analysis.md   # Feature gap evaluation of the APCIE builder
│   ├── fyp_compliance_report.md     # Academic compliance scorecard for Final Year Project (FYP)
│   └── next_ai_handoff.md           # Handoff briefing for next AI or developer agent
│
├── shared/                          # Strict contract boundary layer
│   └── telemetryContract.ts         # Single Source of Truth for TS and Python Pydantic
│
├── services/                        # Production system diagnostic & data services
│   ├── db.ts                        # IndexedDB (SentinelDB v9) async store
│   ├── dbHelpers.ts                 # SQL & mock db helpers
│   ├── diagnosticProvider.ts        # Telemetry routing gateway (Mock/Python modes)
│   ├── pcBuilder.ts                 # Compatibility scoring calculations
│   ├── pcComponents.ts              # Pre-populated hardware parts catalog database
│   ├── systemHealthMonitor.ts       # Graded 0-100 Health score calculator
│   ├── telemetryStreamManager.ts    # Polling & WebSocket manager (active/idle states)
│   ├── websocketManager.ts          # WS connection, heartbeat, backoff routines
│   ├── telemetryQueue.ts            # Client retry queue buffer for offline reliability
│   ├── telemetryAggregator.ts       # Sliding windows (5s/30s) sampling and decimation
│   ├── routingEngine.ts             # Smart AI diagnostic triage engine
│   └── geminiService.ts             # Server proxy helper for AI diagnostics (Safe API)
│
├── hooks/                           # Shared UI states
│   └── useDebounce.ts               # Action and input debounce helper
│
├── components/                      # Design-focused layouts & custom UI modules
│   ├── Common/                      # Core styling blocks
│   │   ├── Sidebar.tsx              # Dynamic collapsible sidebar structure
│   │   ├── TopNavBar.tsx            # Multi-service browser tab controller
│   │   └── Card.tsx                 # Modular styling containers
│   │
│   ├── Layout/                      # Section compositions
│   │   ├── UserAppLayout.tsx        # Diagnostic & user service grid
│   │   ├── TechnicianAppLayout.tsx  # Queue dashboard & dispatch manager
│   │   └── AuthScreen.tsx           # Dual Mode (Mock/Python) login gateway
│   │
│   └── Services/                    # Specialized application modules
│       ├── SystemHealth.tsx         # Real-time resource charts and metrics
│       ├── PerformanceOptimizer.tsx # Thread controls & performance compaction
│       ├── StorageIntelligence.tsx  # Disk analyzers, duplication discovery
│       ├── NetworkDiagnostics.tsx   # Latency monitors & transfer forensics
│       ├── HardwareDrivers.tsx      # Low-level component specifications & scores
│       ├── SecurityStability.tsx    # Signature audits & stability event tracking
│       ├── PowerInsights.tsx        # Charge tracking & battery wear charts
│       │
│       ├── user/                    # User interface panels
│       │   ├── BuildPlanner.tsx      # Main APCIE shell component
│       │   ├── BuildScorePanel.tsx   # Modular score breakdown & power calculations dashboard
│       │   ├── BuildSuggestionsPanel.tsx # Automated alternative parts selection suggestions card
│       │   ├── BuildCard.tsx         # Layout render element for saved specifications
│       │   ├── BrowseServiceGigs.tsx # Marketplace repair catalog
│       │   ├── ActiveRequests.tsx    # SLA updates & live technician timeline
│       │   └── ServiceSummaryViewer.tsx # Itemized invoicing (USD/PKR) & reports
│       │
│       ├── technician/              # Technician interface panels
│       │   ├── GigManagement.tsx     # Custom service creation boards
│       │   ├── ActiveJobsList.tsx    # Interactive ticketing dashboard
│       │   └── JobHandoverForm.tsx   # Parts, labor & invoice generators
│       │
│       └── admin/                   # Administrative diagnostics
│           ├── AdminRequestsMgmt.tsx # Overrides and tech reassignment panels
│           ├── AdminSystemReports.tsx # System metrics auditing boards
│           └── AdminTechsMgmt.tsx    # Technician performance panels
│
└── backend/                         # Integrated FastAPI Python Backend (Separated Repository)
    ├── main.py                      # FastAPI App execution mount
    ├── requirements.txt             # Core system dependencies
```
