# Smart PC Hub — Full Project Context

> **Created:** July 24, 2026
> **Purpose:** University FYP project — PC repair & service management platform
> **Stack:** Laravel 11 (PHP 8.3) backend + React 19 (Vite) frontend, SQLite database

---

## 1. Project Layout

```
C:\Users\CORE\Desktop\0FYP\
├── APP\                          ← CURRENT PROJECT (active)
│   ├── frontend\                 ← React 19 + Vite on port 3000
│   │   ├── components\Services\  ← All page components
│   │   ├── hooks\useCachedQuery.ts
│   │   ├── services\api.ts
│   │   └── types.ts
│   └── backend-laravel\          ← Laravel 11 on port 8000
│       ├── app\Http\Controllers\Api\V1\
│       ├── routes\api.php
│       └── database\database.sqlite
│
├── BACHUPS\APPCopy\              ← SOURCE OF TRUTH (backup, do not modify)
│
└── context.md                    ← This file
```

---

## 2. Server & DB Setup

- **Backend:** `C:\php83\php.exe artisan serve` → `http://localhost:8000/api`
- **Frontend:** `npm run dev` → `http://localhost:3000`
- **DB:** SQLite at `backend-laravel/database/database.sqlite`
- **Auth:** Laravel Sanctum token auth (stateful middleware REMOVED from `bootstrap/app.php`)
- **PHP:** 8.3 at `C:\php83`

### Seeded Accounts
| Email | Password | Role |
|---|---|---|
| admin@smartpchub.test | password | admin |
| ali.hassan@smartpchub.test | password | technician |
| customer1@smartpchub.test | password | user |

### Build Commands
```bash
# Frontend dev
cd C:\Users\CORE\Desktop\0FYP\APP\frontend
npm run dev

# Frontend build (use node directly, npm can timeout in PowerShell)
node node_modules\vite\bin\vite.js build

# TypeScript check (5 pre-existing errors, all harmless — esbuild ignores them)
npx tsc --noEmit

# Backend
cd C:\Users\CORE\Desktop\0FYP\APP\backend-laravel
C:\php83\php.exe artisan serve
```

---

## 3. CRITICAL CONSTRAINTS — MUST FOLLOW

### NO UI/DESIGN/CSS/LAYOUT/ROUTE/API CHANGES
Only loading architecture updates. Never change:
- Visual design, CSS classes, layout structure
- Route definitions (unless adding a new API route for loading)
- API endpoints
- Component structure beyond loading state handling

### Windows Case-Insensitive Hazard
PowerShell `Remove-Item -Recurse common` on Windows DELETES `Common` (uppercase) too.
This caused a major regression before — `ErrorBoundary.tsx`, `ReloadPrompt.tsx`, `ImageUploader.tsx` were deleted.
**NEVER use `Remove-Item` on folder names that could match other casings.**
These files had to be restored from backup.

---

## 4. Progressive Loading Architecture (COMPLETED)

### Strategy
UI renders instantly with default/placeholder values → cached values appear immediately if available → live API data replaces in background per-widget. Never block the full page on any API call.

### How It Works
- `useCachedQuery` hook accepts `defaultValue: T` parameter
- Initial state = cached value (if within staleTime) or defaultValue
- Component always renders immediately with data (never null/undefined)
- Background fetch replaces data when API responds
- `isRefreshing` boolean + `lastUpdated` timestamp for indicators
- `LastUpdated` component shows "3s ago" / "Updating..." indicator

### useCachedQuery Hook (`hooks/useCachedQuery.ts`)
```typescript
const cache = new Map<string, { data: any; timestamp: number }>();

interface UseCachedQueryOptions<T> {
  staleTimeMs: number;        // Cache duration before refetch
  fetchFn: () => Promise<T>;  // API call
  defaultValue: T;            // Initial render value (NEVER null)
  polling?: boolean;          // Auto-refetch (default true)
}

interface UseCachedQueryResult<T> {
  data: T;                    // Always defined (never null)
  isRefreshing: boolean;
  lastUpdated: number;        // Epoch ms
  refetch: () => Promise<void>;
}
```

### Pattern for Every Component
```typescript
const DEFAULT_DATA: MyType = { /* zero values */ };

const MyComponent: React.FC = () => {
  const { data, isRefreshing, lastUpdated } = useCachedQuery<MyType>('key', {
    staleTimeMs: 5000,
    fetchFn: fetchData,
    defaultValue: DEFAULT_DATA,
  });

  // NO loading checks, NO isFirstLoad, NO null guards
  // Always render with data directly
  return <div>{data.someField}</div>;
};
```

### LastUpdated Component (`components/Common/LastUpdated.tsx`)
Shows relative time since last fetch, with refreshing indicator.

---

## 5. All Updated Components (Progressive Loading — COMPLETE)

| Component | File | Cache Key | Default |
|---|---|---|---|
| HealthIntelligence | `Services/HealthIntelligence.tsx` | `health` | DEFAULT_HEALTH (cpu 0%, ram 0%, disk 0%, Online status) |
| PerformanceOptimizer | `Services/PerformanceOptimizer.tsx` | `performance` | DEFAULT_PERF (cpu 0%, 0 processes) |
| NetworkDiagnostics | `Services/NetworkDiagnostics.tsx` | `network` | DEFAULT_NETWORK (0ms latency, Connecting...) |
| StorageIntelligence | `Services/StorageIntelligence.tsx` | `storage` | DEFAULT_STORAGE (0 drives, 0 files) |
| HardwareDrivers | `Services/HardwareDrivers.tsx` | `hardware` | DEFAULT_HARDWARE (Scanning... placeholders) |
| ReportsHistory | `Services/ReportsHistory.tsx` | `analytics` | DEFAULT_ANALYTICS (0 values, Connecting...) |
| SecurityStability | `Services/SecurityStability.tsx` | `security` | Already clean before this session |

**All verified:** Zero `isFirstLoad`, zero `loading ?` ternary, zero `if (loading)` blocks in all 7 components.

---

## 6. Backend API Endpoints (All Functional)

### System Health (SystemHealthController)
- `GET /api/v1/system/health` — CPU, RAM, disk, uptime, PHP/Laravel version
- `GET /api/v1/system/performance` — CPU, RAM, disk usage + performance score
- `GET /api/v1/system/processes` — Top processes by RAM
- `GET /api/v1/system/network` — Adapters, latency, DNS, gateway, throughput
- `GET /api/v1/system/drives` — All drives with health, capacity, type
- `GET /api/v1/system/hardware` — CPU, GPU, BIOS, motherboard, RAM, network card
- `GET /api/v1/system/file-stats` — Desktop file/folder counts
- `GET /api/v1/system/storage` — Combined storage + file stats

### Reports (ReportsController)
- `GET /api/v1/reports/analytics` — Full dashboard: repairs, users, security, performance, database, API analytics, audit logs

### Auth (Sanctum)
- `POST /api/v1/login` — Returns token
- `POST /api/v1/logout` — Revokes token
- `GET /api/v1/user` — Current user profile

### Other
- Repair CRUD, Gig CRUD, PC Build, Lifecycle Events, Technician assignments, etc.

---

## 7. Known Issues (Pre-existing, Do NOT Fix)

1. `RegisterScreen.tsx:21` — ADMIN→'user' role downgrade (admins must be seeded server-side)
2. `GigController` route lacks `role:` middleware (controller has manual check)
3. `UserResource` doesn't expose `specialty` → TechnicianDashboard falls back to `'General Hardware'`
4. `services/db.ts`/`dbHelpers.ts` remain (imported by telemetry subsystem)
5. Hardware endpoint scan takes ~8.8s (WMIC slow) — acceptable with progressive loading
6. Reports analytics endpoint blocks PHP single-threaded dev server during security scan `exec()` calls — dev server limitation only
7. **TypeScript errors (5 pre-existing, harmless):**
   - `ErrorBoundary.tsx` — Class component `this.state`/`this.props` (3 errors)
   - `ProfileScreen.tsx:13` — Type cast missing `passwordHash`
   - `api.ts:3` — `import.meta.env` type (Vite env types not configured)

---

## 8. Important File Map

### Frontend
- `hooks/useCachedQuery.ts` — Enterprise cache hook with defaultValue
- `components/Common/LastUpdated.tsx` — "3s ago" relative timestamp
- `components/Common/ErrorBoundary.tsx` — Class-based error boundary (restored from backup)
- `components/Common/ReloadPrompt.tsx` — PWA reload prompt (restored from backup)
- `components/Common/ImageUploader.tsx` — Image upload component (restored from backup)
- `services/api.ts` — Axios client with Sanctum interceptor
- `types.ts` — AuditLog, ServiceType, LifecycleEvent types

### Backend
- `app/Http/Controllers/Api/V1/SystemHealthController.php` — All system metrics (~620 lines)
- `app/Http/Controllers/Api/V1/ReportsController.php` — Analytics aggregation endpoint
- `routes/api.php` — All API routes (auth:sanctum protected)
- `bootstrap/app.php` — `$middleware->statefulApi()` REMOVED

---

## 9. Session History (What Was Done Before This File)

### Phase 1: Foundation
1. Migrated from IndexedDB/Python to Laravel 11 + React 19
2. Set up SQLite, Sanctum auth, seeded accounts
3. Built all user journeys (technician, customer, admin)

### Phase 2: Backend Integration
4. Replaced all IndexedDB calls with real Laravel API endpoints
5. Built SystemHealthController with 7 system metric endpoints
6. Built ReportsController for analytics dashboard
7. Removed `$middleware->statefulApi()` for pure token auth

### Phase 3: External Examiner Audit
8. Verified all 18 user journeys (92% completion)
9. Fixed session/CSRF issues
10. Upgraded all 6 monitoring pages to real Laravel data

### Phase 4: Enterprise Loading (This Session)
11. Created `useCachedQuery` hook with `defaultValue` parameter
12. Created `LastUpdated` component
13. Refactored all 6 monitoring dashboard components to progressive loading
14. Verified: Zero `isFirstLoad`/`loading` references remain
15. Verified: No new TypeScript errors introduced

---

## 10. Next Steps / Future Work

### If continuing development:
- [ ] Add WebSocket support for real-time updates (replace polling)
- [ ] Implement service worker caching for offline support
- [ ] Add pagination to audit logs
- [ ] Implement report PDF export (currently only JSON)
- [ ] Add more detailed hardware health metrics
- [ ] Mobile responsive testing on all dashboard pages

### If external examiner demo:
- All pages load instantly with progressive rendering
- Backend returns real system metrics (CPU, RAM, disk, network, hardware)
- All 18 user journeys functional
- Reports & Analytics page shows full executive dashboard

---

## 11. Quick Reference — Starting Servers

```bash
# Terminal 1: Backend
cd C:\Users\CORE\Desktop\0FYP\APP\backend-laravel
C:\php83\php.exe artisan serve

# Terminal 2: Frontend
cd C:\Users\CORE\Desktop\0FYP\APP\frontend
npm run dev
```

Frontend: http://localhost:3000
Backend API: http://localhost:8000/api
