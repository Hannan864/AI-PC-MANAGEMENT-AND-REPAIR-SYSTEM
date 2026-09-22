# Smart PC Hub — Database Schema Design

## Entity Relationship Overview

```mermaid
erDiagram
    users {
        uuid id PK
        string name
        string email UK
        string password
        enum role "user|technician|admin"
        enum status "active|suspended"
        string profile_image NULL
        timestamp email_verified_at NULL
        timestamps created_at_updated_at
    }

    technician_profiles {
        bigint id PK
        uuid user_id FK
        string specialty NULL
        decimal rating "3,2"
        boolean is_available
        text bio NULL
        int jobs_completed
        timestamps created_at_updated_at
    }

    repair_requests {
        uuid id PK
        uuid user_id FK
        uuid technician_id FK_NULL
        string issue_category NULL
        text issue_description
        enum severity_level "low|medium|high"
        enum status "submitted|assigned|accepted|in_progress|waiting_parts|testing|completed|cancelled"
        json system_specifications NULL
        json user_images NULL
        json tech_images NULL
        timestamps created_at_updated_at
    }

    lifecycle_events {
        bigint id PK
        uuid repair_request_id FK
        string status
        uuid updated_by FK
        text note NULL
        timestamp created_at
    }

    completion_reports {
        uuid id PK
        uuid repair_request_id FK_UNIQUE
        text issue_summary
        text root_cause
        json parts_replaced NULL
        decimal labor_cost "10,2"
        decimal total_cost "10,2"
        text work_notes NULL
        int time_spent_minutes
        timestamps created_at_updated_at
    }

    pc_builds {
        uuid id PK
        uuid user_id FK
        uuid technician_id FK_NULL
        string build_name
        string cpu
        string gpu
        string motherboard
        string ram
        string storage
        string power_supply
        string chassis NULL
        decimal estimated_cost_usd NULL
        decimal estimated_cost_pkr NULL
        enum compatibility_status "pass|warning|fail"
        smallint performance_score
        json issues NULL
        json bottlenecks NULL
        enum status "draft|submitted_review|under_review|reviewed"
        text user_notes NULL
        text technician_notes NULL
        timestamps created_at_updated_at
    }

    users ||--o{ repair_requests : "submits (user_id)"
    users ||--o{ repair_requests : "assigned to (technician_id)"
    users ||--o| technician_profiles : "has profile"
    users ||--o{ pc_builds : "creates (user_id)"
    users ||--o{ pc_builds : "reviews (technician_id)"
    users ||--o{ lifecycle_events : "triggers (updated_by)"
    repair_requests ||--o{ lifecycle_events : "has audit trail"
    repair_requests ||--o| completion_reports : "has report"
```

---

## Table Descriptions

### `users`
Core authentication table. UUID PK prevents sequential ID enumeration via public API.
- `role` distinguishes the three actors: customer, technician, admin
- `status` allows admin to suspend accounts without deletion
- Passwords stored as bcrypt hashes via Laravel's `'password' => 'hashed'` cast

### `technician_profiles`
Extends `users` for technician-specific data. Kept separate to respect SRP.
- `rating` is maintained as a decimal average (updated by Phase 6 completion logic)
- `is_available` is toggled by admin or technician — used in assignment dropdown

### `repair_requests`
The central ticket entity. Gig/marketplace columns are intentionally absent.
- Dual FK to `users`: `user_id` (customer) and `technician_id` (assigned tech, nullable)
- `system_specifications` stores a static snapshot of hardware context captured at submission time
- `user_images` / `tech_images` store arrays of relative file paths (Laravel Storage)
- Status enum covers the full Admin Assignment Workflow lifecycle

### `lifecycle_events`
Immutable append-only audit trail. One record per status change.
- No `updated_at` — events are never modified
- `updated_by` FK captures which actor (admin/tech/customer) made the change
- Replaces the client-side `LifecycleEvent[]` array from `types.ts`

### `completion_reports`
Filed by technician on job closure. One-to-one with `repair_requests`.
- `parts_replaced` JSON: `[{ name, price_pkr, quantity }]`
- All costs in Pakistani Rupees (PKR) as primary currency
- Used to generate the final service invoice in Phase 6

### `pc_builds`
Stores custom PC configurations with compatibility analysis results.
- `chassis` replaces the TypeScript `case` field (reserved DB keyword)
- `issues` / `bottlenecks` JSON arrays populated by the server-side compatibility engine (Phase 4)
- `estimated_cost_pkr` uses PKR as primary currency with USD secondary reference

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| UUID primary keys | Prevents sequential ID enumeration in public API responses |
| Separate `technician_profiles` | SRP: avoids bloating `users` table with role-specific fields |
| JSON columns for specs/images/parts | Avoids unnecessary join tables for semi-structured data |
| No `gig`/`marketplace` tables | Out of FYP approved scope — Admin Assignment Workflow only |
| `lifecycle_events` append-only | Provides immutable audit trail; SLA tracking in Phase 6 |
| PKR as primary currency | Project targets Pakistani market; USD retained as reference only |
| `AI_ENABLED` in .env | Modular AI layer — disableable without touching application code |
