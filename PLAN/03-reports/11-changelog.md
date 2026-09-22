# Changelog: Smart PC Hub

All notable changes to this project will be documented in this file.

## [Phase 1: Workspace Reorganization & Python Deprecation] - 2026-07-11

### Added
- Created complete enterprise directory structure:
  - `/frontend` for React web application.
  - `/backend-laravel` for the new Laravel backend.
  - `/backend-python-deprecated` for the legacy Python backend reference.
  - `/docs` for project-wide documentation.
  - `/database`, `/api-spec`, `/postman`, `/flutter`, `/storage`, `/uploads`, `/tests` subdirectories.
- Added `/backend-python-deprecated/DEPRECATED.md` documentation explaining the Python deprecation status and guidelines.

### Changed
- Reorganized workspace:
  - Moved legacy Python backend code (`main.py`, `requirements.txt`) into `/backend-python-deprecated` to make room for Laravel backend.
  - Moved React frontend codebase (components, services, hooks, configs, node_modules, etc.) into the `/frontend` subfolder.
- Updated `START_SYSTEM.bat` system launcher script:
  - Removed execution instructions for the Python backend.
  - Rerouted frontend execution commands to operate inside the `/frontend` subfolder.
  - Prepared serve parameters for the upcoming Laravel backend.

## [Phase 2: Database Schema & Laravel Initialization] - 2026-07-11

### Schema Analysis
- Audited `frontend/types.ts` against approved FYP requirements.
- **Dropped** legacy entities: `Gig`, `GigCategory`, `DiagnosticSnapshot`, `SystemStats`, `ProcessInfo`, `StorageReport`, `Session` (replaced by Sanctum), `UserHistory` (derived via queries).
- **Retained and mapped**: `User`, `TechnicianProfile`, `RepairRequest`, `LifecycleEvent`, `ServiceCompletionReport` → `CompletionReport`, `PCBuild`.
- **Corrected**: Renamed `buildId` → `id`, `case` → `chassis` (reserved keyword), removed all gig/marketplace FK fields from `RepairRequest`.

### Added — Migrations (`backend-laravel/database/migrations/`)
- `2026_07_11_000001_create_users_table.php` — UUID PK, role enum, status enum
- `2026_07_11_000002_create_personal_access_tokens_table.php` — Laravel Sanctum tokens
- `2026_07_11_000003_create_technician_profiles_table.php` — specialty, rating, availability
- `2026_07_11_000004_create_repair_requests_table.php` — full status enum, JSON columns, dual FK
- `2026_07_11_000005_create_lifecycle_events_table.php` — append-only audit log
- `2026_07_11_000006_create_completion_reports_table.php` — JSON parts, PKR cost fields
- `2026_07_11_000007_create_pc_builds_table.php` — compatibility engine output JSON columns

### Added — Eloquent Models (`backend-laravel/app/Models/`)
- `User.php` — HasUuids, HasApiTokens (Sanctum), role helpers, all relationships
- `TechnicianProfile.php` — belongsTo User, typed casts
- `RepairRequest.php` — HasUuids, JSON casts, lifecycle + completion relationships
- `LifecycleEvent.php` — UPDATED_AT=null (immutable), actor relationship
- `CompletionReport.php` — HasUuids, JSON + decimal casts
- `PCBuild.php` — HasUuids, JSON + cost casts, compatibility helpers

### Added — Factories (`backend-laravel/database/factories/`)
- `UserFactory.php` — admin(), technician(), suspended() states
- `TechnicianProfileFactory.php` — available(), unavailable() states, realistic specialties
- `RepairRequestFactory.php` — assigned(), inProgress(), completed() states, fake system specs
- `PCBuildFactory.php` — withWarning(), withFailure(), submittedForReview() states, PKR costs

### Added — Seeders (`backend-laravel/database/seeders/`)
- `DatabaseSeeder.php` — orchestrates seeder order (FK-safe)
- `UserSeeder.php` — 1 admin + 3 technicians (with profiles) + 5 customers
- `RepairRequestSeeder.php` — 5 demo requests covering all workflow states + full lifecycle logs + 1 completion report

### Added — Services (`backend-laravel/app/Services/AI/`)
- `AITriageInterface.php` — contract for modular AI triage
- `LocalRuleBasedTriageService.php` — keyword-matching fallback (zero external deps)
- `GeminiTriageService.php` — Gemini API integration with auto-fallback on failure

### Added — Middleware & Providers
- `app/Http/Middleware/RoleMiddleware.php` — RBAC middleware (multi-role, suspended check)
- `app/Providers/AppServiceProvider.php` — modular AI driver binding via .env

### Added — Configuration & Routes
- `config/ai.php` — AI driver configuration mapped from .env
- `routes/api.php` — versioned API routes skeleton (all phases) with role middleware
- `composer.json` — Laravel 11 package manifest
- `.env.example` — template with MySQL, Sanctum, AI, and CORS variables

### Added — Documentation
- `backend-laravel/README.md` — setup guide with prerequisites and test account table
- `database/SCHEMA.md` — ERD diagram (Mermaid) + table descriptions + design decisions

### Changed
- `implementation_plan.md` — Renamed Phase 8 label to "MySQL Transition"; marked Phase 2 as In Progress.

## [Phase 3: Authentication & Profile API Development] - 2026-07-11

### Added — Laravel Framework Skeleton
- `artisan` — CLI entry point.
- `public/index.php` — HTTP entry point.
- `bootstrap/app.php` — Application bootstrap with Sanctum middleware, CORS, and RoleMiddleware alias.
- `config/database.php` — MySQL/SQLite connection configuration.
- `config/cors.php` — CORS policy allowing React dev server origins.
- `config/auth.php` — Authentication guards (Sanctum), user providers (Eloquent).
- `config/sanctum.php` — Sanctum stateful domains and token configuration.

### Added — Form Request Validation Classes (`app/Http/Requests/Api/V1/`)
- `RegisterRequest.php` — Validates name, email (unique), password (min 8, mixed case, numbers, confirmed).
- `LoginRequest.php` — Validates email + password presence.
- `UpdateProfileRequest.php` — Validates optional name, email (unique ignoring current user), password.

### Added — API Resource Classes (`app/Http/Resources/`)
- `UserResource.php` — Standardizes user output (id, name, email, role, status, profileImage, timestamps). Never exposes password or tokens.
- `TokenResource.php` — Wraps Sanctum token + UserResource on login/register. Plain-text token included only on creation.

### Added — Service Classes (`app/Services/`)
- `AuthService.php` — Business logic for register (UUID create + token), login (credential check + active status + token), logout (revoke current token), updateProfile (name/email/password with bcrypt).

### Added — Controllers (`app/Http/Controllers/`)
- `BaseController.php` — Abstract controller with sendResponse/sendError/sendMessage standardized JSON envelope methods.
- `Api/V1/AuthController.php` — POST register, POST login, POST logout, GET me. Delegates to AuthService.
- `Api/V1/UserController.php` — GET profile, PUT profile. Delegates to AuthService.
- `Api/V1/AdminController.php` — GET users (paginated), PUT user status, GET technicians, GET dashboard stats.
- `Api/V1/PCBuildController.php` — Stubbed for Phase 4.
- `Api/V1/RepairRequestController.php` — Stubbed for Phase 5.
- `Api/V1/AIController.php` — Stubbed for Phase 7.

### Changed
- `.env.example` — Updated `SANCTUM_STATEFUL_DOMAINS` and `FRONTEND_URL` to match Vite dev server on port 3000.

### API Endpoint Summary (Phase 3 — functional)
| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/auth/register` | POST | None | Create account + return token |
| `/api/v1/auth/login` | POST | None | Authenticate + return token |
| `/api/v1/auth/logout` | POST | Sanctum | Revoke current token |
| `/api/v1/auth/me` | GET | Sanctum | Get current user profile |
| `/api/v1/user/profile` | GET | Sanctum | Get authenticated user profile |
| `/api/v1/user/profile` | PUT | Sanctum | Update authenticated user profile |
| `/api/v1/admin/users` | GET | Admin | List all users (paginated) |
| `/api/v1/admin/users/{id}/status` | PUT | Admin | Activate/suspend user |
| `/api/v1/admin/technicians` | GET | Admin | List all technicians |
| `/api/v1/admin/dashboard` | GET | Admin | Aggregate statistics |

### Pending Local Verification
- Run `composer install` in `/backend-laravel` to install vendor dependencies.
- Copy `.env.example` to `.env` and configure MySQL credentials.
- Run `php artisan key:generate` to set `APP_KEY`.
- Run `php artisan migrate:fresh --seed` to initialize database.
- Run `php artisan storage:link` for file upload symlinks.
- Run `php artisan serve` and test endpoints via Postman/curl.
- Verify Sanctum token flow: register → receive token → access authenticated route.
- Verify role middleware: access admin route with non-admin token → expect 403.

## [Phase 4: PC Build Planner & Cost Estimator API] - 2026-07-12

### Added — Server-Side Compatibility Engine
- `app/Services/CompatibilityService.php` — Full component compatibility validation with CPU+motherboard socket matching, RAM type validation, PSU wattage sufficiency checks, bottleneck detection, and performance scoring (0-100).
- Component specification database covering all 10 CPUs, 6 motherboards, 5 RAM kits, 4 PSUs, and 10 GPUs from the factory.

### Added — Cost Estimation Service
- `app/Services/CostEstimationService.php` — Component-level price estimation in USD and PKR with per-component breakdown. Static pricing database for all 40+ components.

### Added — Form Request Validation Classes
- `app/Http/Requests/Api/V1/StorePCBuildRequest.php` — Validates required component fields (cpu, gpu, motherboard, ram, storage, power_supply) and optional chassis/user_notes.
- `app/Http/Requests/Api/V1/UpdatePCBuildRequest.php` — All fields optional (partial updates), only provided fields are recalculated.

### Added — API Resource Classes
- `app/Http/Resources/PCBuildResource.php` — Transforms PCBuild model with camelCase keys (buildName, userId, estimatedCostUsd, compatibilityStatus, etc.). Never exposes raw database column names.
- `app/Http/Resources/PCBuildCollection.php` — Wraps paginated results with metadata (total, page, perPage, lastPage).

### Added — Authorization Policy
- `app/Policies/PCBuildPolicy.php` — RBAC authorization: users manage own builds, technicians manage assigned builds, admins have full access. Enforces draft-only deletion and compatibility-pass-only submission.

### Changed — Controllers
- `app/Http/Controllers/Api/V1/PCBuildController.php` — Replaced 6 stub methods with full implementation: index (paginated, role-filtered), store (auto-runs compatibility + cost estimation), show (policy-gated), update (recalculates on component change), destroy (draft-only), submitForReview (pass-only).

### Changed — Models
- `app/Models/PCBuild.php` — Added query scopes: `scopeDraft`, `scopeSubmitted`, `scopeForUser`, `scopeAssignedTo`, `scopeCompatible`. Added `Builder` import.

### API Endpoint Summary (Phase 4 — functional)
| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/pc-builds` | GET | Sanctum | List builds (filtered by role) |
| `/api/v1/pc-builds` | POST | Sanctum | Create build (auto-compatibility + cost) |
| `/api/v1/pc-builds/{id}` | GET | Sanctum | Get single build (policy-gated) |
| `/api/v1/pc-builds/{id}` | PUT | Sanctum | Update build (recalculates compatibility) |
| `/api/v1/pc-builds/{id}` | DELETE | Sanctum | Delete draft build |
| `/api/v1/pc-builds/{id}/submit-review` | POST | Sanctum | Submit compatible draft for review |

### Pending Local Verification
- Run `php artisan test --filter=PCBuild` to verify policy and controller logic.
- Test compatibility engine with mismatched CPU+motherboard → expect `fail` status.
- Test cost estimation matches expected component prices.
- Verify role-based listing: customer sees only own builds, technician sees assigned + own, admin sees all.
- Verify submit-review rejected for non-draft or non-pass builds.

### Changed — Phase 4 Bug Fixes (2026-07-12)
- `app/Http/Controllers/Api/V1/PCBuildController.php` — Fixed SQL query grouping bug in `index()` where `orWhere` without grouping caused incorrect status filtering for technicians. Replaced `Gate::denies()` with `Gate::authorize()` for cleaner exception handling.
- `app/Services/CompatibilityService.php` — Refactored hardcoded bottleneck detection (`in_array()` with model name lists) to data-driven approach using `GPU_TIER` mapping and `BOTTLENECK_MATRIX` constant. Adding new GPUs no longer requires editing conditional logic.
- `app/Http/Resources/PCBuildCollection.php` — Fixed missing space before `=>` in meta.lastPage.

## [Phase 5: Repair Request Management & Admin Assignment API] - 2026-07-12

### Added — Service Classes
- `app/Services/RepairService.php` — Full business logic for repair request lifecycle: creation, assignment, status updates, image uploads, completion reports, service history queries, SLA calculations, admin reporting summaries.
- `app/Services/LifecycleService.php` — Strict state machine for status transitions with validation. Creates immutable lifecycle events on every status change. Supports `canTransition()`, `getAllowedTransitions()`, and `getAllStatuses()`.

### Added — Form Request Validation Classes
- `app/Http/Requests/Api/V1/StoreRepairRequestRequest.php` — Validates issue description (required, min 10), severity level, optional system specifications (nested array), optional user images (max 10, image types, 5MB limit).
- `app/Http/Requests/Api/V1/AssignTechnicianRequest.php` — Validates technician_id (required, exists in users).
- `app/Http/Requests/Api/V1/UpdateRepairStatusRequest.php` — Validates status (required, in valid statuses), optional note.
- `app/Http/Requests/Api/V1/CompleteReportRequest.php` — Validates issue summary, root cause, parts list (nested array with name/cost), labor cost, time spent, optional completion images.

### Added — API Resource Classes
- `app/Http/Resources/RepairRequestResource.php` — Transforms RepairRequest with camelCase keys, nested user, technician, lifecycle events, and completion report.
- `app/Http/Resources/LifecycleEventResource.php` — Transforms LifecycleEvent with actor relationship, immutable event output.
- `app/Http/Resources/CompletionReportResource.php` — Transforms CompletionReport with parts list, labor cost, total cost for invoice-ready output.

### Added — Authorization Policy
- `app/Policies/RepairRequestPolicy.php` — RBAC: customers manage own requests (delete only submitted), technicians manage assigned requests, admins have full access. Separate methods for assign, updateStatus, complete.

### Changed — Controllers
- `app/Http/Controllers/Api/V1/RepairRequestController.php` — Replaced 6 stub methods with full implementation including: index (paginated, filtered, searchable, sortable), store (with image uploads), show (with SLA timeline), assign (admin), updateStatus (technician/admin), complete (technician with report), delete (submitted only), serviceHistory, technicianHistory, adminReport, timeline.

### Changed — Routes
- `routes/api.php` — Added: DELETE `/repair-requests/{id}`, GET `/repair-requests/{id}/timeline`, GET `/user/service-history`, GET `/technician/service-history`, GET `/admin/reports/summary`.

### API Endpoint Summary (Phase 5 & 6 — functional)
| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/repair-requests` | GET | Sanctum | List requests (filtered by role, searchable, sortable) |
| `/api/v1/repair-requests` | POST | Sanctum | Create request (with optional image uploads) |
| `/api/v1/repair-requests/{id}` | GET | Sanctum | Get request (with SLA timeline) |
| `/api/v1/repair-requests/{id}` | DELETE | Sanctum | Delete submitted request |
| `/api/v1/repair-requests/{id}/assign` | POST | Admin | Assign technician |
| `/api/v1/repair-requests/{id}/status` | POST | Tech/Admin | Update status (validated transitions) |
| `/api/v1/repair-requests/{id}/complete` | POST | Technician | Submit completion report |
| `/api/v1/repair-requests/{id}/timeline` | GET | Sanctum | Get lifecycle timeline with SLA |
| `/api/v1/user/service-history` | GET | Sanctum | Customer's repair history |
| `/api/v1/technician/service-history` | GET | Technician | Technician's assigned repairs history |
| `/api/v1/admin/reports/summary` | GET | Admin | Aggregate stats, cost/category/severity breakdowns |

### Pending Local Verification
- Run `php artisan migrate:fresh --seed` to verify all migrations.
- Test status transition validation: try invalid transition → expect 422 error.
- Test image upload: submit repair request with images → verify files in `storage/app/public/`.
- Test completion report with parts list → verify total_cost calculation.
- Test SLA timeline: create request → assign → complete → verify duration fields.
- Test admin report: verify category/severity/status breakdowns.
- Test service history: customer sees own, technician sees assigned.

## [Phase 7: AI Triage Module] - 2026-07-12

### Added
- `app/Services/AIManager.php` — centralized facade for all AI operations (triage, severity, category).
- `app/Http/Requests/Api/V1/AITriageRequest.php` — form request validation for AI triage payload.
- `app/Http/Resources/AITriageResource.php` — standardized response transformer for AI triage results.

### Changed
- Replaced `app/Http/Controllers/Api/V1/AIController.php` stub with full implementation using `AIManager`.

### Architecture
- `AIManager` delegates to `AITriageInterface` (bound via `AppServiceProvider`).
- `LocalRuleBasedTriageService` — default fallback when `AI_ENABLED=false`.
- `GeminiTriageService` — optional Gemini driver, used only when enabled.
- AI is never tightly coupled to Gemini; `AI_ENABLED=false` gracefully falls back to local rules.

### Verified
- Existing `AITriageInterface`, `LocalRuleBasedTriageService`, `GeminiTriageService`, `config/ai.php`, `AppServiceProvider` binding all correct.

## [Phase 8: Frontend API Integration] - 2026-07-12

### Added
- `frontend/services/api.ts` — Axios client with Sanctum token, interceptors, typed helpers.
- `frontend/services/authApi.ts` — register, login, logout, me, profile, token management.
- `frontend/services/pcBuildApi.ts` — full CRUD + submitForReview.
- `frontend/services/repairApi.ts` — full CRUD + assign, status, complete, timeline, service history.
- `frontend/services/adminApi.ts` — users, technicians, dashboard, reports, AI triage.

### Changed
- `frontend/types.ts` — complete rewrite aligning all types with Laravel API responses (camelCase keys, proper enums).
- `frontend/components/Layout/AuthProvider.tsx` — replaced IndexedDB session management with `authApi` calls.
- `frontend/components/Services/auth/LoginScreen.tsx` — uses `authApi.login()`, removed Python/Sentinel branding.
- `frontend/components/Services/auth/RegisterScreen.tsx` — uses `authApi.register()`, removed Python/Sentinel branding.
- `frontend/components/Services/auth/ProfileScreen.tsx` — uses `authApi.updateProfile()`.
- `frontend/components/Services/user/NewRepairRequest.tsx` — rewritten to use `repairApi`, removed Gig marketplace references.
- `frontend/components/Services/RequestTechnicianHelp.tsx` — rewritten to use `repairApi`, removed Gig marketplace.
- `frontend/components/Services/dashboard/AdminDashboard.tsx` — rewritten to use `adminApi`, removed Python telemetry panel.
- `frontend/components/Services/user/ActiveRequestsUser.tsx` — fixed status enum references.
- `frontend/components/Services/user/BuildPlanner.tsx` — replaced "System Sentinel" branding.
- `frontend/components/Services/user/AssignedTechnician.tsx` — removed Gig marketplace references.
- `frontend/components/Layout/RoleRouter.tsx` — removed Python fallback banner.
- `frontend/components/Layout/UserAppLayout.tsx` — removed BrowseGigs, replaced "System Sentinel" with "Smart PC Hub".
- `frontend/components/Layout/TechnicianAppLayout.tsx` — removed GigManagement, replaced "System Sentinel" with "Smart PC Hub".
- `frontend/components/Layout/AdminAppLayout.tsx` — replaced "System Sentinel" with "Smart PC Hub".
- `frontend/services/diagnosticProvider.ts` — simplified to BROWSER/MOCK modes, removed Python references.
- `frontend/hooks/useSystemData.ts` — replaced telemetryStreamManager with polling.
- `frontend/components/Services/HealthIntelligence.tsx` — replaced geminiService with inline health scoring.
- `frontend/constants.tsx` — removed BROWSE_GIGS and GIG_MANAGEMENT service entries.
- `frontend/shared/telemetryContract.ts` — removed Python/Pydantic documentation comments.
- `frontend/vite.config.ts` — updated PWA manifest from "System Sentinel" to "Smart PC Hub".

### Removed
- Legacy provider files: `pythonProvider.ts`, `telemetryBridge.ts`, `telemetryQueue.ts`, `telemetryStreamManager.ts`, `telemetryAggregator.ts`, `telemetrySchemaValidator.ts`, `geminiService.ts`, `systemProbe.ts`, `systemHealthMonitor.ts`, `websocketManager.ts`, `routingEngine.ts`.
- Gig Marketplace components: `BrowseGigs.tsx`, `GigManagement.tsx`.
- Deleted Gig marketplace routes, types, and sidebar entries from all layout files.

### Downgraded
- `frontend/services/db.ts` — downgraded from primary data store to cache/draft-only storage.
