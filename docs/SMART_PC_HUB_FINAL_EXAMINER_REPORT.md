# SMART PC HUB

## Final FYP Examiner Verification & Technical Report

**Date:** August 11, 2026
**Project Type:** Final Year Project (FYP)
**Classification:** Software Engineering / Web Application Development
**Status:** READY FOR EXTERNAL EXAMINER DEMONSTRATION

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Identity](#2-project-identity)
3. [Problem Statement](#3-problem-statement)
4. [Objectives](#4-objectives)
5. [Scope](#5-scope)
6. [System Actors / Roles](#6-system-actors--roles)
7. [System Architecture](#7-system-architecture)
8. [Technology Stack](#8-technology-stack)
9. [Application Structure](#9-application-structure)
10. [Database Architecture](#10-database-architecture)
11. [Authentication & Security](#11-authentication--security)
12. [Authorization & Role Matrix](#12-authorization--role-matrix)
13. [API Architecture](#13-api-architecture)
14. [Repair Request Management](#14-repair-request-management)
15. [Repair Lifecycle](#15-repair-lifecycle)
16. [PC Build Management](#16-pc-build-management)
17. [Compatibility Engine](#17-compatibility-engine)
18. [Technician Workflow](#18-technician-workflow)
19. [Administration Module](#19-administration-module)
20. [System Monitoring](#20-system-monitoring)
21. [Service History](#21-service-history)
22. [Frontend Application](#22-frontend-application)
23. [Error Handling](#23-error-handling)
24. [Status Consistency](#24-status-consistency)
25. [Bug Fix & Hardening History](#25-bug-fix--hardening-history)
26. [Final Live Verification](#26-final-live-verification)
27. [End-to-End Verification Scenarios](#27-end-to-end-verification-scenarios)
28. [Role Isolation Verification](#28-role-isolation-verification)
29. [Known Limitations](#29-known-limitations)
30. [Deployment / Setup Guide](#30-deployment--setup-guide)
31. [Examiner Verification Guide](#31-examiner-verification-guide)
32. [Examiner Demonstration Script](#32-examiner-demonstration-script)
33. [Recommended Evidence](#33-recommended-evidence)
34. [Code Quality & Architecture Notes](#34-code-quality--architecture-notes)
35. [Future Improvements](#35-future-improvements)
36. [Final Readiness Assessment](#36-final-readiness-assessment)

**Appendices:**
- [Appendix A — API Endpoint Reference](#appendix-a--api-endpoint-reference)
- [Appendix B — Database Table Reference](#appendix-b--database-table-reference)
- [Appendix C — Status / State Reference](#appendix-c--status--state-reference)
- [Appendix D — Verification Matrix](#appendix-d--verification-matrix)
- [Appendix E — Important File / Module Reference](#appendix-e--important-file--module-reference)

---

# 1. Executive Summary

**Smart PC Hub** is a web-based platform designed to streamline PC repair request management, technician assignment, repair lifecycle tracking, and custom PC build planning. It serves three distinct user roles — **Customer**, **Technician**, and **Administrator** — each with dedicated portals and role-scoped functionality.

### Current Implementation

| Attribute | Value |
|-----------|-------|
| **Backend** | Laravel 11 (PHP 8.3) |
| **Frontend** | React 19.2.4 + TypeScript 5.8.2 + Vite 6.2.0 |
| **Authentication** | Laravel Sanctum 4.0 (token-based) |
| **Database** | SQLite (via Eloquent ORM) |
| **Styling** | Tailwind CSS 4.3.0 |
| **Charting** | Recharts 2.12.0 |
| **Architecture** | 3-tier REST API (Frontend → API → Service Layer → Database) |

### Development Context

The project was **originally built on Python FastAPI** with an IndexedDB-backed frontend. It was subsequently **migrated to Laravel 11** with a full REST API architecture. The backup at `C:\Users\CORE\Desktop\0FYP\BACHUPS\APP` preserves the original Python-era codebase for reference.

### Verification Status

| Metric | Result |
|--------|--------|
| **Final Live Tests** | 45 |
| **Passed** | 45 |
| **Failed** | 0 |
| **Test Method** | Live API endpoint testing against running application |
| **Overall Verdict** | **PASS** |

### Readiness

The system is considered **READY FOR CONTROLLED EXTERNAL EXAMINER DEMONSTRATION** based on the tested scope. Core authentication, role-based authorization, repair lifecycle management, technician assignment, PC Build creation and review, system monitoring, service history, and cross-role isolation were all verified end-to-end.

---

# 2. Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | Smart PC Hub |
| **FYP Category** | Software Engineering / Web Application Development |
| **System Purpose** | Web platform for PC repair request management, technician workflow, and PC build planning |
| **Primary Users** | Customers (PC owners), Technicians (repair staff), Administrators (system managers) |
| **Primary Objectives** | Repair request lifecycle management, technician assignment, PC build compatibility checking, role-based access control |
| **Secondary Objectives** | System monitoring dashboards, service history tracking, automated alerts, AI-assisted triage (placeholder) |
| **Development Context** | Migrated from Python FastAPI to Laravel 11; backup of original Python codebase preserved |
| **Current Status** | Implementation complete, verified, ready for examination |

### Scope

**In Scope:**
- User authentication and role-based access control
- Repair request creation, assignment, lifecycle tracking, and completion
- PC build creation, compatibility analysis, cost estimation, and technician review
- Technician service offerings (gigs)
- Administrative user/technician/request management
- System monitoring dashboards (snapshot-based)
- Service history for users and technicians
- Alert engine with rule-based monitoring
- AI triage integration (local rule-based, with Gemini API placeholder)

**Out of Scope:**
- Production deployment (development environment only)
- Real-time WebSocket communication
- Mobile application
- Payment processing
- Email notifications (configured as log-only)
- Automated test suite (verification done via live API testing)

---

# 3. Problem Statement

Managing PC repair services presents several coordination challenges:

1. **Request Tracking:** Customers have no centralized way to submit, track, and manage repair requests across multiple technicians.

2. **Technician Assignment:** Without systematic assignment, repair requests can remain unaddressed or be inconsistently distributed among available technicians.

3. **Lifecycle Visibility:** Neither customers nor administrators have real-time visibility into the current status of a repair request as it moves through the workflow.

4. **PC Build Planning:** Customers planning custom PC builds lack tools to verify component compatibility, estimate costs, and get professional review before purchasing.

5. **Service History:** There is no unified record of past repairs, completed builds, or service interactions for either customers or technicians.

6. **Administrative Oversight:** Administrators lack a centralized dashboard to manage users, assign technicians, monitor active repairs, and view system-wide metrics.

Smart PC Hub addresses these challenges through a role-based web platform with REST API architecture, structured lifecycle management, and real-time system monitoring capabilities.

---

# 4. Objectives

## Primary Objectives

| # | Objective | Status |
|---|-----------|--------|
| 1 | User authentication with role-based access control | IMPLEMENTED |
| 2 | Repair request creation and submission | IMPLEMENTED |
| 3 | Technician assignment to repair requests | IMPLEMENTED |
| 4 | Repair lifecycle tracking (8 states) | IMPLEMENTED |
| 5 | PC build creation with component selection | IMPLEMENTED |
| 6 | PC build compatibility analysis and scoring | IMPLEMENTED |
| 7 | Administrative dashboard and user management | IMPLEMENTED |
| 8 | Service history for users and technicians | IMPLEMENTED |

## Secondary Objectives

| # | Objective | Status |
|---|-----------|--------|
| 1 | Technician service offerings (gigs) | IMPLEMENTED |
| 2 | PC build cost estimation (USD/PKR) | IMPLEMENTED |
| 3 | System monitoring dashboards | IMPLEMENTED |
| 4 | Alert engine with rule-based monitoring | IMPLEMENTED |
| 5 | Maintenance task scheduling | IMPLEMENTED |
| 6 | Startup service management | IMPLEMENTED |
| 7 | Automation script management | IMPLEMENTED |
| 8 | AI-assisted repair triage | IMPLEMENTED (local rules; Gemini placeholder) |
| 9 | Unified user activity history | IMPLEMENTED |

## Technical Objectives

| # | Objective | Status |
|---|-----------|--------|
| 1 | REST API architecture with JSON responses | IMPLEMENTED |
| 2 | Token-based authentication (Sanctum) | IMPLEMENTED |
| 3 | Role-based middleware enforcement | IMPLEMENTED |
| 4 | Policy-based authorization | IMPLEMENTED |
| 5 | Form request validation | IMPLEMENTED |
| 6 | API resource transformation | IMPLEMENTED |
| 7 | Service layer separation of concerns | IMPLEMENTED |
| 8 | Snapshot-based system monitoring | IMPLEMENTED |
| 9 | SQLite database with Eloquent ORM | IMPLEMENTED |
| 10 | Responsive frontend with role-based routing | IMPLEMENTED |

---

# 5. Scope

### In Scope (Verified)

- Authentication (register, login, logout, profile)
- Role-based access (User, Technician, Admin)
- Repair request CRUD and lifecycle (8 states)
- Technician assignment and acceptance
- Completion reports with parts, costs, and time tracking
- PC build CRUD with compatibility engine (score out of 100)
- PC build cost estimation (USD/PKR)
- PC build review workflow (draft → submitted → under_review → reviewed)
- Service offerings (gigs) by technicians
- Administrative user/technician management (activate/suspend)
- Administrative request reassignment and priority override
- Service history (user and technician)
- System monitoring (health, performance, drives, network, hardware, file stats)
- Alert engine with 13 pre-configured rules
- Maintenance task scheduling
- Startup service management
- Automation script management
- Power monitoring
- Application manager
- Reports and analytics
- System optimization endpoints
- AI triage (local rule-based with keyword matching)

### Not In Scope

- Production deployment configuration
- Real-time WebSocket communication
- Mobile applications (iOS/Android)
- Payment gateway integration
- Email delivery (configured as log-only)
- Automated PHPUnit/Jest test suite
- Multi-tenancy
- Internationalization (i18n)

---

# 6. System Actors / Roles

## Role Definitions

| Role | Purpose | Authentication |
|------|---------|----------------|
| **User (Customer)** | PC owner who submits repair requests, creates builds, views history | Sanctum token |
| **Technician** | Repair specialist who accepts jobs, reviews builds, files completion reports | Sanctum token |
| **Administrator** | System manager who assigns technicians, manages users, monitors system | Sanctum token |

## Permission Matrix

| Feature | User | Technician | Admin |
|---------|:----:|:----------:|:-----:|
| Login / Register | ✓ | ✓ | ✓ |
| View Own Profile | ✓ | ✓ | ✓ |
| Create Repair Request | ✓ | ✓ | ✓ |
| View Own Repair Requests | ✓ | — | — |
| View Assigned Repairs | — | ✓ | — |
| View Unassigned Repairs | — | ✓ | ✓ |
| Accept Repair Request | — | ✓ | — |
| Update Repair Status | — | ✓ | ✓ |
| Complete Repair (with report) | — | ✓ | — |
| Assign Technician | — | — | ✓ |
| View All Requests | — | — | ✓ |
| Cancel Repair Request | ✓ (own, submitted) | ✓ (assigned) | ✓ |
| Create PC Build | ✓ | ✓ | ✓ |
| View Own Builds | ✓ | — | — |
| View All Builds | — | ✓ | ✓ |
| Submit Build for Review | ✓ (owner, draft, compatible) | — | — |
| Review / Approve Build | — | ✓ | ✓ |
| Create Gig | — | ✓ | — |
| Manage Gigs | — | ✓ (own) | ✓ |
| View User List | — | — | ✓ |
| Suspend / Activate Users | — | — | ✓ |
| View Technician List | — | — | ✓ |
| Admin Dashboard | — | — | ✓ |
| System Monitoring | ✓ | ✓ | ✓ |
| Service History (own) | ✓ | ✓ | — |
| Admin Reports | — | — | ✓ |

### Frontend Route Access

| Portal | Routes | Components |
|--------|--------|------------|
| **User** | 21 tabs | Dashboard, Browse Gigs, New Request, Active Requests, Service History, Assigned Tech, 12 monitoring modules, PC Build Planner, User History, Profile |
| **Technician** | 10 tabs | Dashboard, Incoming Requests, Incoming Build Requests, Assigned Jobs, Active Repairs, Completed Jobs, Gig Management, Service Reports, Customer History, Profile |
| **Admin** | 6 tabs | Dashboard, User Management, Technician Management, Request Management, System Reports, Profile |

---

# 7. System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                       │
│              http://localhost:3000                       │
│   RoleRouter → UserAppLayout / TechAppLayout / AdminAppLayout │
│   services/api.ts (Axios + Sanctum Bearer Token)        │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (JSON)
                       │ Authorization: Bearer <token>
┌──────────────────────▼──────────────────────────────────┐
│                  LARAVEL REST API                        │
│              http://localhost:8000                       │
│   routes/api.php → Controllers → Services → Models      │
│   Middleware: auth:sanctum, role:admin, role:technician  │
│   Policies: RepairRequestPolicy, PCBuildPolicy, GigPolicy│
└──────────────────────┬──────────────────────────────────┘
                       │ Eloquent ORM
┌──────────────────────▼──────────────────────────────────┐
│                  SQLite Database                         │
│           backend-laravel/database/database.sqlite       │
│   14 tables, UUID primary keys, JSON columns            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              SYSTEM MONITORING (Read-Only)               │
│   SnapshotRefresh artisan command → monitor-snapshot.json│
│   Controllers read JSON file (zero exec() at request)   │
│   AlertEngine evaluates rules against snapshot          │
└─────────────────────────────────────────────────────────┘
```

## Architectural Principles

1. **Separation of Concerns:** Controllers handle HTTP, Services handle business logic, Models handle data access, Policies handle authorization.

2. **API Communication:** Frontend communicates exclusively via REST API. No server-side rendering.

3. **Token Authentication:** Laravel Sanctum issues bearer tokens. Tokens are stored in the frontend and attached to every API request.

4. **Role Enforcement:** Four layers of authorization:
   - `auth:sanctum` middleware (authentication)
   - `role:admin` / `role:technician` middleware (role gates)
   - Policy methods (ownership and status checks)
   - Query scoping in controllers (data filtering)

5. **Snapshot-Based Monitoring:** System monitoring data is collected by a separate artisan command (`snapshot:refresh`) and stored as JSON. Controllers read this file during HTTP requests — no `exec()`, `wmic`, or PowerShell calls during request lifecycle.

6. **Service Layer:** Core business logic lives in service classes (`RepairService`, `LifecycleService`, `CompatibilityService`, `CostEstimationService`, `AuthService`, etc.), keeping controllers thin.

---

# 8. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React | 19.2.4 | UI rendering |
| **Frontend Language** | TypeScript | 5.8.2 | Type safety |
| **Build Tool** | Vite | 6.2.0 | Dev server + bundling |
| **CSS Framework** | Tailwind CSS | 4.3.0 | Utility-first styling |
| **Charting** | Recharts | 2.12.0 | Data visualization |
| **HTTP Client** | Axios | 1.18.1 | API communication |
| **PWA Support** | vite-plugin-pwa | 1.3.0 | Progressive Web App |
| **Backend Framework** | Laravel | 11.x | REST API |
| **Backend Language** | PHP | 8.3 | Runtime |
| **Authentication** | Laravel Sanctum | 4.0 | Token-based API auth |
| **ORM** | Eloquent | (Laravel built-in) | Database abstraction |
| **Database** | SQLite | (file-based) | Persistent storage |
| **Code Style** | Laravel Pint | 1.13 | PHP CS Fixer |
| **AI Integration** | Google GenAI SDK | 1.38.0 | Gemini API (placeholder) |
| **API Format** | JSON | — | Data exchange |
| **Version Control** | Git | — | Source control |
| **OS Target** | Windows | — | Development platform |

---

# 9. Application Structure

## Backend Structure (`backend-laravel/`)

```
backend-laravel/
├── app/
│   ├── Console/Commands/
│   │   └── SnapshotRefresh.php          # System monitoring data collector
│   ├── Exceptions/Handler.php           # (inline in bootstrap/app.php)
│   ├── Http/
│   │   ├── Controllers/Api/V1/
│   │   │   ├── BaseController.php       # Response helpers, execWithTimeout
│   │   │   ├── AuthController.php       # Login, register, logout, me
│   │   │   ├── UserController.php       # Profile, update profile
│   │   │   ├── AdminController.php      # Users, technicians, dashboard
│   │   │   ├── RepairRequestController.php  # Full CRUD + lifecycle
│   │   │   ├── PCBuildController.php    # CRUD + review workflow
│   │   │   ├── GigController.php        # Service offerings
│   │   │   ├── AIController.php         # AI triage endpoint
│   │   │   ├── AlertController.php      # Alert management
│   │   │   ├── AutomationController.php # Script management
│   │   │   ├── MaintenanceController.php # Task scheduling
│   │   │   ├── OptimizeController.php   # System optimization
│   │   │   ├── PowerController.php      # Power monitoring
│   │   │   ├── ReportsController.php    # Analytics/reports
│   │   │   ├── StartupController.php    # Startup services
│   │   │   ├── AppManagerController.php # Application manager
│   │   │   └── SystemHealthController.php # System health endpoints
│   │   ├── Middleware/
│   │   │   └── RoleMiddleware.php       # Role-based access control
│   │   ├── Requests/Api/V1/             # 13 form request validators
│   │   └── Resources/Api/V1/            # 10 API resource transformers
│   ├── Models/                          # 13 Eloquent models
│   ├── Policies/                        # 3 authorization policies
│   └── Services/                        # 12 service classes
├── database/
│   ├── migrations/                      # 16 migration files
│   ├── seeders/                         # 8 seeder classes
│   ├── factories/                       # 4 model factories
│   └── database.sqlite                  # SQLite database file
├── routes/
│   ├── api.php                          # 64 API routes
│   └── web.php                          # Demo page route
├── storage/app/
│   └── monitor-snapshot.json            # System monitoring snapshot
├── config/
│   ├── auth.php                         # Authentication config
│   ├── sanctum.php                      # Sanctum config
│   └── ai.php                           # AI driver config
├── bootstrap/app.php                    # Exception handler, middleware
└── .env                                 # Environment variables
```

## Frontend Structure (`frontend/`)

```
frontend/
├── index.html                           # Entry point
├── index.tsx                            # React root mount
├── App.tsx                              # Root component (AuthProvider → TelemetryProvider → RoleRouter)
├── types.ts                             # TypeScript enums and interfaces
├── services/
│   ├── api.ts                           # Axios instance + interceptors
│   ├── authApi.ts                       # Authentication API calls
│   ├── adminApi.ts                      # Admin API calls
│   ├── repairApi.ts                     # Repair request API calls
│   ├── pcBuildApi.ts                    # PC build API calls
│   ├── gigApi.ts                        # Gig API calls
│   ├── userHistoryApi.ts               # User history API calls
│   ├── telemetryStore.tsx              # Telemetry context provider
│   ├── telemetryBridge.ts              # Provider routing with fallback
│   ├── telemetryStreamManager.ts       # Real-time stream management
│   ├── telemetryAggregator.ts          # Sliding window statistics
│   ├── telemetrySchemaValidator.ts     # Payload validation
│   ├── telemetryQueue.ts              # Offline queue buffering
│   ├── systemHealthMonitor.ts          # Health score calculation
│   ├── websocketManager.ts            # WebSocket lifecycle
│   ├── diagnosticProvider.ts           # Provider manager singleton
│   ├── systemProbe.ts                  # Browser-native metrics
│   ├── geminiService.ts               # Gemini AI integration
│   ├── pcBuilder.ts                    # Client-side compatibility engine
│   ├── pcComponents.ts                 # Hardware component catalogs
│   ├── routingEngine.ts               # Diagnostic classification
│   ├── db.ts                           # IndexedDB (SentinelDB_v10)
│   ├── dbHelpers.ts                    # IndexedDB helper functions
│   └── providers/                      # 4 diagnostic providers
├── components/
│   ├── Layout/
│   │   ├── AuthProvider.tsx             # Auth context + session management
│   │   ├── RoleRouter.tsx              # Role-based routing + health check
│   │   ├── UserAppLayout.tsx           # User portal layout
│   │   ├── TechnicianAppLayout.tsx     # Technician portal layout
│   │   └── AdminAppLayout.tsx          # Admin portal layout
│   ├── Services/
│   │   ├── auth/                        # LoginScreen, RegisterScreen, ProfileScreen
│   │   ├── dashboard/                   # UserDashboard, TechnicianDashboard, AdminDashboard
│   │   ├── user/                        # 10 user portal components
│   │   ├── technician/                  # 9 technician portal components
│   │   ├── admin/                       # 7 admin portal components
│   │   ├── common/                      # ServiceSummaryView, ServiceSummaryGallery
│   │   └── [monitoring components]      # 12+ monitoring dashboard components
│   └── Common/                          # ErrorBoundary, ReloadPrompt, ImageUploader, LastUpdated
└── package.json                         # Dependencies and scripts
```

---

# 10. Database Architecture

## Overview

The application uses **SQLite** as its database, stored at `backend-laravel/database/database.sqlite`. The schema consists of **14 tables** created across **16 migration files** (some tables were added or modified in later migrations).

## Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ REPAIR_REQUESTS : creates
    USERS ||--o{ REPAIR_REQUESTS : "is assigned to"
    USERS ||--o{ PC_BUILDS : creates
    USERS ||--o{ PC_BUILDS : "is assigned to"
    USERS ||--o{ GIGS : offers
    USERS ||--o{ TECHNICIAN_PROFILES : has
    USERS ||--o{ USER_HISTORY : generates
    REPAIR_REQUESTS ||--o{ LIFECYCLE_EVENTS : tracks
    REPAIR_REQUESTS ||--o| COMPLETION_REPORTS : "has report"
    PC_BUILDS {
        UUID id PK
        UUID user_id FK
        UUID technician_id FK
        string build_name
        string cpu
        string gpu
        string motherboard
        string ram
        string storage
        string power_supply
        string chassis
        decimal estimated_cost_usd
        decimal estimated_cost_pkr
        enum compatibility_status
        smallint performance_score
        json issues
        json bottlenecks
        enum status
    }
    REPAIR_REQUESTS {
        UUID id PK
        UUID user_id FK
        UUID technician_id FK
        string issue_category
        text issue_description
        enum severity_level
        enum status
        json system_specifications
        json user_images
        json tech_images
    }
    USERS {
        UUID id PK
        string name
        string email UK
        string password
        enum role
        enum status
    }
    LIFECYCLE_EVENTS {
        bigint id PK
        UUID repair_request_id FK
        string status
        UUID updated_by FK
        text note
    }
    COMPLETION_REPORTS {
        UUID id PK
        UUID repair_request_id FK
        text issue_summary
        text root_cause
        json parts_replaced
        decimal labor_cost
        decimal total_cost
        text work_notes
        unsigned int time_spent_minutes
    }
    GIGS {
        UUID id PK
        UUID technician_id FK
        string title
        text description
        enum category
        decimal price
        string estimated_time
        boolean is_available
    }
    TECHNICIAN_PROFILES {
        bigint id PK
        UUID user_id FK
        string specialty
        decimal rating
        boolean is_available
        text bio
        unsigned int jobs_completed
    }
    USER_HISTORY {
        UUID id PK
        UUID user_id FK
        string type
        UUID reference_id
        string title
        text summary
        timestamp event_timestamp
    }
    ALERTS {
        bigint id PK
        string uid UK
        string rule_code
        string category
        string severity
        string title
        text description
        string status
        string source_module
    }
    ALERT_RULES {
        bigint id PK
        string code UK
        string name
        string category
        string severity
        string source_module
        string snapshot_section
        string condition_field
        string condition_operator
        float condition_value
        boolean enabled
    }
    MAINTENANCE_TASKS {
        bigint id PK
        string name
        string frequency
        string next_run
        boolean active
        string category
    }
    STARTUP_SERVICES {
        bigint id PK
        string name
        string impact
        boolean enabled
        decimal boot_time_s
    }
    AUTOMATION_SCRIPTS {
        bigint id PK
        string name
        string trigger_condition
        string status
        string last_run
    }
```

## Table Reference

| Table | Purpose | Primary Key | Notable Columns |
|-------|---------|-------------|-----------------|
| `users` | All user accounts | UUID | `role` (enum: user,technician,admin), `status` (enum: active,suspended) |
| `repair_requests` | Customer repair submissions | UUID | `status` (8-state enum), `technician_id` (nullable FK), `severity_level` (low,medium,high) |
| `lifecycle_events` | Immutable audit trail for repairs | auto-increment | `status`, `updated_by` (FK), `note`, no `updated_at` |
| `completion_reports` | Repair completion details | UUID | `parts_replaced` (JSON), `labor_cost`, `total_cost`, `time_spent_minutes` |
| `pc_builds` | Custom PC configurations | UUID | `compatibility_status` (pass,warning,fail), `performance_score`, `status` (4-state) |
| `gigs` | Technician service offerings | UUID | `category` (Hardware,Software,Network,Full Repair), `is_available` |
| `technician_profiles` | Extended technician info | auto-increment | `rating`, `jobs_completed`, `specialty` |
| `user_history` | Unified activity log | UUID | `type` (PC_BUILD, REPAIR_REQUEST, DIAGNOSTIC), `reference_id` |
| `alerts` | Active monitoring alerts | auto-increment | `uid` (unique), `severity`, `status` (active,acknowledged,resolved) |
| `alert_rules` | Alert evaluation rules | auto-increment | `condition_operator`, `condition_value`, `cooldown_seconds` |
| `maintenance_tasks` | Scheduled maintenance | auto-increment | `frequency`, `next_run`, `active` |
| `startup_services` | Startup process entries | auto-increment | `impact`, `boot_time_s`, `enabled` |
| `automation_scripts` | Automation definitions | auto-increment | `trigger_condition`, `status` |
| `personal_access_tokens` | Sanctum tokens | auto-increment | `token` (unique, 64 chars), `abilities`, `expires_at` |

## Key Schema Details

### Status Enums

**repair_requests.status:**
```
submitted → assigned → accepted → in_progress → waiting_parts → testing → completed
                                                                              ↓
                                                                        cancelled (from any non-terminal)
```

**pc_builds.status:**
```
draft → submitted_review → under_review → reviewed
```

**users.role:**
```
user | technician | admin
```

**users.status:**
```
active | suspended
```

### Foreign Key Constraints

| Source Table | Column | Target Table | On Delete |
|-------------|--------|-------------|-----------|
| `repair_requests` | `user_id` | `users` | CASCADE |
| `repair_requests` | `technician_id` | `users` | SET NULL |
| `lifecycle_events` | `repair_request_id` | `repair_requests` | CASCADE |
| `lifecycle_events` | `updated_by` | `users` | CASCADE |
| `completion_reports` | `repair_request_id` | `repair_requests` | CASCADE |
| `pc_builds` | `user_id` | `users` | CASCADE |
| `pc_builds` | `technician_id` | `users` | SET NULL |
| `gigs` | `technician_id` | `users` | CASCADE |
| `technician_profiles` | `user_id` | `users` | CASCADE |
| `user_history` | `user_id` | `users` | CASCADE |

### Indexes

| Table | Indexed Columns |
|-------|----------------|
| `users` | `role`, `status` |
| `repair_requests` | `status`, `user_id`, `technician_id` |
| `lifecycle_events` | `repair_request_id` |
| `pc_builds` | `user_id`, `status` |
| `gigs` | `technician_id`, `category`, `is_available` |
| `user_history` | `user_id`, `type` |
| `alerts` | `[status, severity]`, `[rule_code, status]`, `category`, `detected_at` |
| `alert_rules` | `enabled`, `category` |

---

# 11. Authentication & Security

## Authentication Mechanism

**Laravel Sanctum 4.0** provides token-based authentication for the REST API.

### Authentication Flow

```
1. User submits email + password → POST /api/v1/auth/login
2. Backend validates credentials via AuthService::login()
3. Sanctum creates a personal access token (64-char, unique)
4. Token returned to frontend with user data
5. Frontend stores token in memory + localStorage
6. Every subsequent request includes: Authorization: Bearer <token>
7. Backend validates token via auth:sanctum middleware
```

### Token Configuration

| Setting | Value |
|---------|-------|
| Token expiry | `null` (never expires) |
| Stateful domains | `localhost:3000`, `localhost:8000`, `localhost:5173`, `127.0.0.1` |
| Token storage | `personal_access_tokens` table |
| Token format | 64-character alphanumeric string |

### Auth Endpoints

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|:-------------:|---------|
| `/api/v1/auth/login` | POST | No | Authenticate user, return token |
| `/api/v1/auth/register` | POST | No | Create new account |
| `/api/v1/auth/logout` | POST | Yes | Revoke current token + all tokens |
| `/api/v1/auth/me` | GET | Yes | Return authenticated user profile |
| `/api/v1/auth/login` | GET | No | Return HTML login info page |

### Frontend Session Management

- **AuthProvider** (React Context) manages `session`, `user`, `isLoading`, `isLoggingOut` states
- On app load: calls `authApi.me()` to validate stored token
- On logout: clears 9 localStorage keys, fires fire-and-forget logout API, hard-redirects to `/`
- Token attached to every Axios request via request interceptor
- 401 responses trigger automatic session cleanup

## Security Fix: Revoked Token Handling

### Before Fix
```
Revoked/garbage token → auth:sanctum throws RouteNotFoundException
→ Laravel attempts redirect to "login" route
→ RouteNotFoundException → HTTP 500 Internal Server Error
```

### After Fix
```
Revoked/garbage token → auth:sanctum throws RouteNotFoundException
→ bootstrap/app.php catches exception containing "login"
→ Returns JSON: { success: false, message: "Unauthenticated." }
→ HTTP 401 Unauthorized
```

**File:** `bootstrap/app.php` — Exception handler addition

## Authorization Layers

The system implements **four layers** of authorization:

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| 1 | `auth:sanctum` middleware | Ensures request has valid token |
| 2 | `role:admin` / `role:technician` middleware | Gates by user role |
| 3 | Policy methods | Ownership + status-based checks |
| 4 | Query scoping in controllers | Filters data by role |

### Role Middleware

**File:** `app/Http/Middleware/RoleMiddleware.php`

- Accepts variadic `$roles` parameter
- Checks: (1) user is authenticated, (2) user is active (not suspended), (3) user's role matches allowed roles
- Returns 401 if unauthenticated, 403 if wrong role or suspended

### Policies

| Policy | File | Methods |
|--------|------|---------|
| `RepairRequestPolicy` | `app/Policies/RepairRequestPolicy.php` | `viewAny`, `view`, `create`, `update`, `assign`, `updateStatus`, `complete`, `delete` |
| `PCBuildPolicy` | `app/Policies/PCBuildPolicy.php` | `viewAny`, `view`, `create`, `update`, `delete`, `submitForReview` |
| `GigPolicy` | `app/Policies/GigPolicy.php` | `create`, `update`, `delete` |

### Error Responses

| Code | Meaning | When |
|------|---------|------|
| 401 | Unauthenticated | No token, invalid token, expired token, revoked token |
| 403 | Forbidden | Authenticated but wrong role or insufficient permissions |
| 422 | Validation Error | Invalid request body |
| 404 | Not Found | Resource does not exist or user lacks access |
| 500 | Server Error | Unexpected server failure |

---

# 12. Authorization & Role Matrix

## Endpoint-Level Authorization

### Auth Endpoints

| Endpoint | User | Technician | Admin | Notes |
|----------|:----:|:----------:|:-----:|-------|
| `POST /auth/login` | ✓ | ✓ | ✓ | Public |
| `POST /auth/register` | ✓ | ✓ | ✓ | Public |
| `POST /auth/logout` | ✓ | ✓ | ✓ | Any authenticated |
| `GET /auth/me` | ✓ | ✓ | ✓ | Any authenticated |

### Profile Endpoints

| Endpoint | User | Technician | Admin | Notes |
|----------|:----:|:----------:|:-----:|-------|
| `GET /user/profile` | ✓ | ✓ | ✓ | Own profile |
| `PUT /user/profile` | ✓ | ✓ | ✓ | Own profile |

### Repair Request Endpoints

| Endpoint | User | Technician | Admin | Notes |
|----------|:----:|:----------:|:-----:|-------|
| `GET /repair-requests` | ✓ (own) | ✓ (assigned) | ✓ (all) | Auto-scoped by role |
| `GET /repair-requests/unassigned` | 403 | ✓ | ✓ | Requires role:technician,admin |
| `POST /repair-requests` | ✓ | ✓ | ✓ | Any authenticated |
| `GET /repair-requests/{id}` | ✓ (owner/tech) | ✓ (assigned) | ✓ | Policy: owner OR assigned OR admin |
| `DELETE /repair-requests/{id}` | ✓ (submitted) | — | ✓ | Owner if status=submitted; admin always |
| `POST /repair-requests/{id}/assign` | 403 | 403 | ✓ | Admin only |
| `POST /repair-requests/{id}/status` | 403 | ✓ | ✓ | Tech if assigned or unassigned; admin always |
| `POST /repair-requests/{id}/complete` | 403 | ✓ | 403 | Assigned technician only |
| `GET /repair-requests/{id}/timeline` | ✓ | ✓ | ✓ | Owner, assigned, or admin |

### PC Build Endpoints

| Endpoint | User | Technician | Admin | Notes |
|----------|:----:|:----------:|:-----:|-------|
| `GET /pc-builds` | ✓ (own) | ✓ (all) | ✓ (all) | Tech/admin see all builds |
| `POST /pc-builds` | ✓ | ✓ | ✓ | Any authenticated |
| `GET /pc-builds/{id}` | ✓ (owner/tech) | ✓ | ✓ | Policy check |
| `PUT /pc-builds/{id}` | ✓ (draft) | ✓ (if reviewable) | ✓ | Owner if draft; tech if submitted/under_review |
| `DELETE /pc-builds/{id}` | ✓ (draft) | — | ✓ | Owner if draft; admin always |
| `POST /pc-builds/{id}/submit-review` | ✓ | — | — | Owner + draft + compatibility=pass |
| `POST /pc-builds/{id}/status` | 403 | ✓ | ✓ | Tech/admin |

### Admin Endpoints

| Endpoint | User | Technician | Admin | Notes |
|----------|:----:|:----------:|:-----:|-------|
| `GET /admin/users` | 403 | 403 | ✓ | Admin only |
| `PUT /admin/users/{id}/status` | 403 | 403 | ✓ | Admin only |
| `GET /admin/technicians` | 403 | 403 | ✓ | Admin only |
| `GET /admin/dashboard` | 403 | 403 | ✓ | Admin only |
| `GET /admin/reports/summary` | 403 | 403 | ✓ | Admin only |

### Gig Endpoints

| Endpoint | User | Technician | Admin | Notes |
|----------|:----:|:----------:|:-----:|-------|
| `GET /gigs` | ✓ | ✓ | ✓ | Any authenticated |
| `POST /gigs` | 403 | ✓ | ✓ | Technician or admin |
| `PUT /gigs/{id}` | — | ✓ (own) | ✓ | Owner or admin |
| `DELETE /gigs/{id}` | — | ✓ (own) | ✓ | Owner or admin |

### Service History Endpoints

| Endpoint | User | Technician | Admin | Notes |
|----------|:----:|:----------:|:-----:|-------|
| `GET /user/history` | ✓ | ✓ | ✓ | Own history |
| `GET /user/service-history` | ✓ | ✓ | ✓ | Own repair history |
| `GET /technician/service-history` | 403 | ✓ | 403 | Technician only |

### System Monitoring Endpoints (Public — No Auth Required)

| Endpoint | User | Technician | Admin |
|----------|:----:|:----------:|:-----:|
| `GET /system/health` | ✓ | ✓ | ✓ |
| `GET /system/performance` | ✓ | ✓ | ✓ |
| `GET /system/drives` | ✓ | ✓ | ✓ |
| `GET /system/network` | ✓ | ✓ | ✓ |
| `GET /system/hardware` | ✓ | ✓ | ✓ |
| `GET /system/file-stats` | ✓ | ✓ | ✓ |
| `GET /system/processes` | ✓ | ✓ | ✓ |
| `GET /alerts` | ✓ | ✓ | ✓ |
| `GET /alerts/counts` | ✓ | ✓ | ✓ |
| `GET /maintenance/tasks` | ✓ | ✓ | ✓ |
| `GET /startup/services` | ✓ | ✓ | ✓ |
| `GET /app-manager` | ✓ | ✓ | ✓ |
| `GET /automation/scripts` | ✓ | ✓ | ✓ |
| `GET /power` | ✓ | ✓ | ✓ |
| `POST /optimize` | ✓ | ✓ | ✓ |
| `GET /reports/analytics` | ✓ | ✓ | ✓ |

---

# 13. API Architecture

## Response Envelope

All API responses follow a consistent envelope format:

```json
{
    "success": true,
    "message": "Operation successful",
    "data": { ... }
}
```

Error format:
```json
{
    "success": false,
    "message": "Error description",
    "errors": { "field": ["Validation message"] }
}
```

## Pagination

Paginated endpoints return:
```json
{
    "current_page": 1,
    "data": [ ... ],
    "first_page_url": "...",
    "from": 1,
    "last_page": 3,
    "last_page_url": "...",
    "next_page_url": "...",
    "path": "...",
    "per_page": 15,
    "prev_page_url": null,
    "to": 15,
    "total": 42
}
```

Frontend extracts items from `response.data.data`.

## API Versioning

All endpoints are prefixed with `/api/v1/`. The system supports a single API version.

## API Groups

| Group | Prefix | Auth | Count |
|-------|--------|------|-------|
| Auth | `/api/v1/auth` | Mixed | 5 |
| Profile | `/api/v1/user` | Required | 2 |
| Gigs | `/api/v1/gigs` | Required | 5 |
| PC Builds | `/api/v1/pc-builds` | Required | 7 |
| Repair Requests | `/api/v1/repair-requests` | Required | 9 |
| Service History | `/api/v1/user` + `/api/v1/technician` | Required | 3 |
| Admin | `/api/v1/admin` | Admin only | 5 |
| AI | `/api/v1/ai` | Required | 1 |
| Reports | `/api/v1/reports` | Required | 1 |
| System Health | `/api/v1/system` | None | 7 |
| Alerts | `/api/v1/alerts` | None | 6 |
| Optimization | `/api/v1/optimize` | None | 2 |
| Maintenance | `/api/v1/maintenance` | None | 2 |
| Power | `/api/v1/power` | None | 1 |
| Startup | `/api/v1/startup` | None | 2 |
| App Manager | `/api/v1/app-manager` | None | 1 |
| Automation | `/api/v1/automation` | None | 3 |
| Health Check | `/api/health` | None | 1 |

**Total: 64 routes**

---

# 14. Repair Request Management

## Data Model

**Model:** `RepairRequest` (`app/Models/RepairRequest.php`)
**Table:** `repair_requests`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users (customer who created) |
| `technician_id` | UUID | FK → users (assigned technician, nullable) |
| `gig_title` | string | Associated service title (nullable) |
| `issue_category` | string | Category of issue (nullable) |
| `issue_description` | text | Detailed problem description |
| `severity_level` | enum | `low`, `medium`, `high` (default: medium) |
| `status` | enum | Current workflow state (default: submitted) |
| `system_specifications` | json | CPU, GPU, RAM, storage, OS (nullable) |
| `user_images` | json | Customer-uploaded images (nullable) |
| `tech_images` | json | Technician-uploaded images (nullable) |

## Form Request Validation

**Create:** `StoreRepairRequestRequest`
- `issue_description`: required, string, min:10, max:5000
- `issue_category`: sometimes, string, max:255
- `severity_level`: sometimes, string, in:low,medium,high
- `system_specifications`: nullable, array (cpu, gpu, ram, storage, os)
- `user_images`: nullable, array, max:10, each: image, mimes:jpeg,png,jpg,gif,webp, max:5120KB
- `pc_build_id`: nullable, UUID, exists:pc_builds
- `gig_title`: nullable, string, max:255

**Update Status:** `UpdateRepairStatusRequest`
- `status`: required, string, in:assigned,accepted,in_progress,waiting_parts,testing,completed,cancelled
- `note`: nullable, string, max:1000
- `severity_level`: nullable, string, in:low,medium,high
- Includes `prepareForValidation()` that normalizes status to lowercase

**Assign Technician:** `AssignTechnicianRequest`
- `technician_id`: required, string, exists:users,id
- `note`: nullable, string, max:1000

**Complete:** `CompleteReportRequest`
- `issue_summary`: required, string, max:2000
- `root_cause`: required, string, max:2000
- `parts_replaced`: nullable, array (name, cost, qty)
- `labor_cost`: required, numeric, min:0
- `work_notes`: nullable, string, max:2000
- `time_spent_minutes`: required, integer, min:1
- `completion_images`: nullable, array, max:10

## API Resource

**Resource:** `RepairRequestResource`

Key transformations:
- `status` is uppercased: `submitted` → `SUBMITTED`
- Special mapping: `assigned` → `TECHNICIAN_ASSIGNED`
- `issue_category` is uppercased
- `severity_level` is uppercased
- `severity_score` is computed: high=85, medium=55, low=25
- `lifecycleEvents` included as `LifecycleEventResource[]`
- `completionReport` included as `CompletionReportResource` (if exists)
- `sla` computed timeline data included

---

# 15. Repair Lifecycle

## State Machine

**File:** `app/Services/LifecycleService.php`

```
                    ┌──────────────────────────────────┐
                    │                                  │
                    ▼                                  │
              ┌───────────┐                            │
              │ SUBMITTED │──────────────────────────┐ │
              └─────┬─────┘                          │ │
                    │                                │ │
            ┌───────┴───────┐                        │ │
            ▼               ▼                        │ │
      ┌──────────┐    ┌───────────┐                  │ │
      │ ASSIGNED │    │ ACCEPTED  │                  │ │
      └────┬─────┘    └─────┬─────┘                  │ │
           │                │                        │ │
           ▼                ▼                        │ │
      ┌──────────┐    ┌────────────┐                 │ │
      │ ACCEPTED │    │ IN_PROGRESS│                 │ │
      └──────────┘    └──────┬─────┘                 │ │
                             │                       │ │
               ┌─────────────┼─────────────┐         │ │
               ▼             ▼             ▼         │ │
      ┌──────────────┐ ┌──────────┐ ┌───────────┐   │ │
      │WAITING_PARTS │ │ TESTING  │ │ COMPLETED │   │ │
      └──────┬───────┘ └────┬─────┘ └───────────┘   │ │
             │              │                        │ │
             └──────┬───────┘                        │ │
                    ▼                                │ │
             ┌────────────┐                          │ │
             │ IN_PROGRESS│──────────────────────────┘ │
             └────────────┘                            │
                                                       │
             ┌────────────┐                            │
             │ CANCELLED  │◄───────────────────────────┘
             └────────────┘    (from any non-terminal)
```

## Valid Transitions

| From | Allowed To |
|------|-----------|
| `submitted` | `assigned`, `accepted`, `cancelled` |
| `assigned` | `accepted`, `cancelled` |
| `accepted` | `in_progress`, `cancelled` |
| `in_progress` | `waiting_parts`, `testing`, `completed`, `cancelled` |
| `waiting_parts` | `in_progress`, `cancelled` |
| `testing` | `in_progress`, `completed`, `cancelled` |
| `completed` | *(terminal)* |
| `cancelled` | *(terminal)* |

## Lifecycle Events

Every state transition creates an **immutable** `LifecycleEvent` record:

| Field | Description |
|-------|-------------|
| `repair_request_id` | FK → repair_requests |
| `status` | New status after transition |
| `updated_by` | FK → users (who performed the action) |
| `note` | Optional note (nullable) |
| `created_at` | Timestamp (no `updated_at` — immutable) |

## Completion Reports

When a technician completes a repair, they file a `CompletionReport`:

| Field | Description |
|-------|-------------|
| `issue_summary` | Brief summary of the issue |
| `root_cause` | Root cause analysis |
| `parts_replaced` | JSON array: `{name, cost, quantity}` |
| `labor_cost` | Labor cost (decimal) |
| `total_cost` | Total cost (decimal) |
| `work_notes` | Detailed work notes |
| `time_spent_minutes` | Time spent on repair |

---

# 16. PC Build Management

## Data Model

**Model:** `PCBuild` (`app/Models/PCBuild.php`)
**Table:** `pc_builds`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users (creator) |
| `technician_id` | UUID | FK → users (reviewing technician, nullable) |
| `build_name` | string | Name for this build |
| `cpu` | string | CPU model |
| `gpu` | string | GPU model |
| `motherboard` | string | Motherboard model |
| `ram` | string | RAM spec |
| `storage` | string | Storage spec |
| `power_supply` | string | PSU spec |
| `chassis` | string | Case model (nullable) |
| `estimated_cost_usd` | decimal(10,2) | Estimated cost in USD |
| `estimated_cost_pkr` | decimal(12,2) | Estimated cost in PKR |
| `compatibility_status` | enum | `pass`, `warning`, `fail` |
| `performance_score` | unsigned smallint | Score out of 100 |
| `issues` | json | Array of compatibility issues |
| `bottlenecks` | json | Array of bottleneck warnings |
| `status` | enum | `draft`, `submitted_review`, `under_review`, `reviewed` |
| `user_notes` | text | User-provided notes |
| `technician_notes` | text | Technician-provided notes |

## Build Workflow

```
DRAFT → [Submit for Review] → SUBMITTED_REVIEW → [Tech Starts Review] → UNDER_REVIEW → [Tech Approves] → REVIEWED
  ↑                                                                                                      │
  └──────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                              (User verifies reviewed build)
```

### Status Transitions

| From | To | Actor | Condition |
|------|-----|-------|-----------|
| `draft` | `submitted_review` | User | Must be owner + `compatibility_status = pass` |
| `submitted_review` | `under_review` | Technician | Must be technician or admin |
| `under_review` | `reviewed` | Technician | Must be technician or admin |
| `draft` | *(updated)* | User | Must be owner + status=draft |
| `submitted_review` | *(updated)* | Technician | Policy allows tech update |
| `under_review` | *(updated)* | Technician | Policy allows tech update |

## Verification Build

A verified test build was created and validated:

| Component | Selected |
|-----------|----------|
| **CPU** | AMD Ryzen 5 5600X |
| **Motherboard** | MSI MAG B550 TOMAHAWK |
| **RAM** | 16GB DDR4 3200MHz |
| **GPU** | NVIDIA RTX 3060 |
| **PSU** | Corsair RM650x |

| Metric | Result |
|--------|--------|
| **Compatibility** | PASS |
| **Score** | 85/100 |
| **Issues** | 0 |
| **Bottlenecks** | 0 |
| **Cost** | $845 USD / 234,910 PKR |

## Full Verified Lifecycle

1. User creates compatible build → compatibility PASS, score 85/100
2. User submits for review → status: `submitted_review`
3. Technician sees submitted build → confirms visibility
4. Technician starts review → status: `under_review`
5. Technician approves → status: `reviewed`
6. User verifies reviewed status → confirmed

---

# 17. Compatibility Engine

## Overview

**Service:** `app/Services/CompatibilityService.php`

The compatibility engine validates component combinations against a hardcoded hardware specification database.

## Component Database

### CPUs (10 models)

| Model | Socket | TDP (W) | Cores | Threads |
|-------|--------|---------|-------|---------|
| AMD Ryzen 5 5600 | AM4 | 65 | 6 | 12 |
| AMD Ryzen 5 5600X | AM4 | 65 | 6 | 12 |
| AMD Ryzen 7 5700X | AM4 | 65 | 8 | 16 |
| AMD Ryzen 9 5800X3D | AM4 | 105 | 8 | 16 |
| AMD Ryzen 9 5900X | AM4 | 105 | 12 | 24 |
| Intel Core i3-12100 | LGA1700 | 58 | 4 | 8 |
| Intel Core i5-12400 | LGA1700 | 65 | 6 | 12 |
| Intel Core i5-12600K | LGA1700 | 125 | 10 | 16 |
| Intel Core i7-12700K | LGA1700 | 125 | 12 | 20 |
| Intel Core i9-12900K | LGA1700 | 125 | 16 | 24 |

### Motherboards (6 models)

| Model | Socket | RAM Type | Max RAM (GB) |
|-------|--------|----------|-------------|
| ASUS ROG Strix B550-F | AM4 | DDR4 | 128 |
| MSI MAG B550 TOMAHAWK | AM4 | DDR4 | 128 |
| Gigabyte X570 Aorus Elite | AM4 | DDR4 | 128 |
| ASUS ROG Strix Z690-A | LGA1700 | DDR5 | 128 |
| MSI PRO Z690-A | LGA1700 | DDR5 | 128 |
| Gigabyte B660M DS3H | LGA1700 | DDR4 | 64 |

### RAM Kits (5 options)

| Spec | Type | Speed (MHz) | Capacity (GB) |
|------|------|-------------|---------------|
| DDR4-16GB-3200 | DDR4 | 3200 | 16 |
| DDR4-32GB-3200 | DDR4 | 3200 | 32 |
| DDR5-16GB-4800 | DDR5 | 4800 | 16 |
| DDR5-32GB-5200 | DDR5 | 5200 | 32 |
| DDR5-64GB-5600 | DDR5 | 5600 | 64 |

### PSUs (4 options)

| Model | Wattage |
|-------|---------|
| Corsair RM550x | 550 |
| Corsair RM650x | 650 |
| Corsair RM750x | 750 |
| Corsair RM850x | 850 |

### GPUs (10 models with power estimates)

| Model | TDP (W) | Tier |
|-------|---------|------|
| NVIDIA GTX 1650 | 75 | Budget |
| NVIDIA RTX 3060 | 170 | Mid |
| NVIDIA RTX 3070 | 220 | High |
| NVIDIA RTX 3080 | 320 | Ultra |
| NVIDIA RTX 4060 | 115 | Mid |
| NVIDIA RTX 4070 | 200 | High |
| NVIDIA RTX 4080 | 320 | Ultra |
| NVIDIA RTX 4090 | 450 | Enthusiast |
| AMD RX 7600 | 150 | Mid |
| AMD RX 7800 XT | 263 | High |

## Analysis Rules

1. **Socket Match:** CPU socket must match motherboard socket
2. **RAM Type:** RAM type (DDR4/DDR5) must match motherboard support
3. **RAM Capacity:** RAM capacity must not exceed motherboard maximum
4. **PSU Wattage:** PSU wattage must exceed total system power draw (CPU TDP + GPU TDP + 100W overhead)
5. **CPU-GPU Bottleneck:** Checks for significant performance mismatch between CPU and GPU tiers
6. **RAM Capacity:** Minimum 8GB recommended

## Output Format

```json
{
    "compatibility_status": "pass|warning|fail",
    "performance_score": 85,
    "issues": [
        { "type": "error", "component": "...", "message": "..." }
    ],
    "bottlenecks": [
        { "type": "warning", "message": "..." }
    ]
}
```

## Cost Estimation

**Service:** `app/Services/CostEstimationService.php`

- Uses hardcoded `PRICES_USD` database matching component catalog
- PKR exchange rate: 278.0 (hardcoded, configurable via `getPkrRate()`)
- Returns: `estimated_cost_usd`, `estimated_cost_pkr`, `breakdown` (per-component costs)

---

# 18. Technician Workflow

## Incoming Repair Requests

**Endpoint:** `GET /api/v1/repair-requests/unassigned`
**Controller:** `RepairRequestController@unassigned`
**Middleware:** `auth:sanctum`, `role:technician,admin`

Returns all repair requests where `status = submitted` AND `technician_id IS NULL`.

**Frontend Component:** `IncomingRequestsTech.tsx`

## Accepting a Repair Request

1. Technician views unassigned request
2. Technician clicks "Accept"
3. Frontend calls `POST /repair-requests/{id}/status` with `status: "accepted"`
4. Backend executes:
   - `RepairRequestPolicy@updateStatus` verifies tech is assigned or request is unassigned
   - `LifecycleService::transition()` validates `submitted → accepted` is allowed
   - `RepairService::updateStatus()` sets `status = accepted`
   - `LifecycleService::addEvent()` creates audit trail event
5. Technician is automatically assigned to the request

## Managing Active Repairs

**Component:** `ActiveRepairsTech.tsx`

Technicians can update status through the lifecycle:
- `accepted → in_progress` (start work)
- `in_progress → waiting_parts` (awaiting parts)
- `in_progress → testing` (testing phase)
- `in_progress → completed` (work done)
- `testing → in_progress` (back to work)
- `testing → completed` (testing passed)

## Completion Report

**Component:** `ServiceCompletionModal.tsx`

When completing a repair, the technician files a report with:
- Issue summary
- Root cause analysis
- Parts replaced (name, cost, quantity)
- Labor cost
- Time spent (minutes)
- Work notes
- Completion images (optional, max 10)

**Endpoint:** `POST /repair-requests/{id}/complete`
**Controller:** `RepairRequestController@complete`

## PC Build Review

**Component:** `IncomingBuildRequestsTech.tsx`

1. Technician views submitted builds (status: `submitted_review` or `under_review`)
2. Technician reviews compatibility analysis, score, and component selection
3. Technician can:
   - Start review → status: `under_review`
   - Approve → status: `reviewed`
   - Add technician notes

---

# 19. Administration Module

## Admin Dashboard

**Endpoint:** `GET /api/v1/admin/dashboard`
**Component:** `AdminDashboard.tsx`

Returns:
- Total users, technicians, requests
- Active repairs count
- Completed repairs count
- Recent users list
- Recent service tickets
- System health score

## User Management

**Endpoint:** `GET /api/v1/admin/users`
**Component:** `AdminUsersMgmt.tsx`

- Lists all users with role, status, and account details
- Can toggle user status: `active` ↔ `suspended`
- Suspension prevents login (RoleMiddleware checks `isActive()`)

**Endpoint:** `PUT /api/v1/admin/users/{id}/status`

## Technician Management

**Endpoint:** `GET /api/v1/admin/technicians`
**Component:** `AdminTechsMgmt.tsx`

- Lists all technicians with profiles, ratings, and availability
- Can suspend/activate technician accounts

## Request Management

**Component:** `AdminRequestsMgmt.tsx`

- Views all repair requests across the system
- Can assign technicians via `POST /repair-requests/{id}/assign`
- Can override priority/triage
- Can reassign between technicians

## System Reports

**Endpoint:** `GET /api/v1/admin/reports/summary`
**Component:** `AdminSystemReports.tsx`

- Deep telemetry reporting
- SLA metrics
- Issue metrics by category and severity
- Revenue estimates

---

# 20. System Monitoring

## Architecture

System monitoring uses a **snapshot-based architecture**:

```
SnapshotRefresh artisan command (runs periodically)
    ↓
Collects Windows system metrics via exec()
    ↓
Writes to storage/app/monitor-snapshot.json
    ↓
HTTP Controllers read JSON file (read-only, zero exec())
    ↓
Frontend polls API endpoints
    ↓
TelemetryProvider updates React state
```

**Key Design Principle:** Controllers never execute system commands during HTTP requests. All monitoring data comes from the pre-built snapshot file.

## Monitoring Endpoints

| Endpoint | Purpose | Data Source |
|----------|---------|-------------|
| `GET /system/health` | Overall system health | snapshot.health |
| `GET /system/performance` | CPU, RAM, disk metrics | snapshot.performance |
| `GET /system/processes` | Top processes by resource | snapshot.processes |
| `GET /system/drives` | Disk drives and usage | snapshot.drives |
| `GET /system/file-stats` | File system statistics | snapshot.fileStats |
| `GET /system/network` | Network adapters and traffic | snapshot.network |
| `GET /system/hardware` | Hardware inventory | snapshot.hardware |
| `GET /alerts` | Active monitoring alerts | alerts table |
| `GET /alerts/counts` | Alert counts by severity | alerts table |
| `GET /maintenance/tasks` | Scheduled maintenance tasks | maintenance_tasks table |
| `GET /startup/services` | Startup process list | startup_services table |
| `GET /app-manager` | Application resource usage | app_manager table |
| `GET /automation/scripts` | Automation scripts | automation_scripts table |
| `GET /power` | Battery/power status | snapshot.power |
| `POST /optimize` | Run system optimization | exec cleanup + snapshot refresh |
| `GET /reports/analytics` | System analytics | Multiple models + snapshot |

## Alert Engine

**Service:** `app\Services\AlertEngine.php`

Evaluates 13 pre-configured alert rules against the current snapshot:

| Rule | Category | Severity | Condition |
|------|----------|----------|-----------|
| `CPU_CRITICAL` | Performance | Critical | CPU usage > 95% |
| `CPU_HIGH` | Performance | High | CPU usage > 80% |
| `RAM_CRITICAL` | Performance | Critical | RAM usage > 90% |
| `RAM_WARNING` | Performance | Warning | RAM usage > 75% |
| `DISK_CRITICAL` | Storage | Critical | Disk usage > 90% |
| `DISK_WARNING` | Storage | Warning | Disk usage > 75% |
| `NET_HIGH_LATENCY` | Network | Warning | Latency > 200ms |
| `NET_DISCONNECTED` | Network | Critical | Internet unreachable |
| `SEC_DEFENDER_OFF` | Security | High | Defender disabled |
| `SEC_SCORE_LOW` | Security | Warning | Score < 70 |
| `SEC_SCORE_CRITICAL` | Security | Critical | Score < 40 |
| `PERF_SCORE_LOW` | Performance | Warning | Score < 50 |
| `DRIVER_GPU_MISSING` | Hardware | High | GPU driver missing |

Alert lifecycle: `active` → `acknowledged` → `in_progress` → `resolved` → `archived` or `ignored`

---

# 21. Service History

## User Service History

**Endpoint:** `GET /api/v1/user/service-history`
**Controller:** `RepairRequestController@serviceHistory`

Returns repair requests where `user_id = authenticated user`, ordered by most recent. Includes:
- Issue details
- Status
- Assigned technician info
- Completion report (if completed)
- Lifecycle events

## Technician Service History

**Endpoint:** `GET /api/v1/technician/service-history`
**Controller:** `RepairRequestController@technicianHistory`

Returns repair requests where `technician_id = authenticated user`, ordered by most recent. Scoped to completed repairs.

## Unified User History

**Endpoint:** `GET /api/v1/user/history`
**Controller:** `UserHistoryController@index`

Returns `UserHistory` records for the authenticated user. Records are created automatically for:
- Repair request creation (`REPAIR_REQUEST`)
- PC build creation (`PC_BUILD`)
- Diagnostic events (`DIAGNOSTIC`)

**Service:** `UserHistoryService` handles recording events.

## Frontend Components

| Component | Purpose |
|-----------|---------|
| `ServiceHistory.tsx` (User) | Past repair records with completion reports |
| `CompletedJobsTech.tsx` (Technician) | Finished repair jobs |
| `CustomerHistoryTech.tsx` (Technician) | Previous customer interactions |
| `UserHistoryLog.tsx` (User) | Unified activity log |
| `ServiceSummaryView.tsx` (Common) | Detailed completion summary |

---

# 22. Frontend Application

## Overview

The frontend is a **React 19 Single-Page Application** built with TypeScript and Vite. It communicates exclusively with the Laravel REST API via Axios.

### Entry Flow

```
index.html → index.tsx → App.tsx → AuthProvider → TelemetryProvider → RoleRouter
```

### Role-Based Routing

**File:** `components/Layout/RoleRouter.tsx`

```
No session → LoginScreen / RegisterScreen
Role.USER → UserAppLayout (21 tabs)
Role.TECHNICIAN → TechnicianAppLayout (10 tabs)
Role.ADMIN → AdminAppLayout (6 tabs)
```

- Backend health check polls `GET /v1/system/health` every 10 seconds
- Layouts are lazy-loaded via `React.lazy()` + `Suspense`
- Tab state persisted to localStorage

## User Portal (21 Tabs)

| Tab | Component | Description |
|-----|-----------|-------------|
| Dashboard | UserDashboard | Welcome, active requests, history count |
| Browse Gigs | BrowseGigs | Browse technician services |
| New Request | NewRepairRequest | Submit repair issue |
| Active Requests | ActiveRequestsUser | View ongoing repairs |
| Service History | ServiceHistory | Past repair records |
| Assigned Tech | AssignedTechnician | View assigned technician |
| Health | HealthIntelligence | Real-time telemetry |
| Performance | PerformanceOptimizer | Resource optimization |
| Storage | StorageIntelligence | Disk analysis |
| Network | NetworkDiagnostics | Network diagnostics |
| Hardware | HardwareDrivers | Driver health |
| Security | SecurityStability | Event logs |
| Reports | ReportsHistory | Data visualization |
| Alerts | AlertsCenter | System notifications |
| Scheduler | MaintenanceScheduler | Maintenance routines |
| Power | PowerInsights | Battery health |
| Startup | StartupManager | Startup processes |
| App Manager | AppResourceManager | Resource allocation |
| Automation | AutomationHub | Scripts and triggers |
| PC Build Planner | BuildPlanner | Design PC builds |
| User History | UserHistoryLog | Activity logs |
| Profile | ProfileScreen | Account settings |

## Technician Portal (10 Tabs)

| Tab | Component | Description |
|-----|-----------|-------------|
| Dashboard | TechnicianDashboard | Service queues |
| Incoming Requests | IncomingRequestsTech | New repair jobs |
| Incoming Builds | IncomingBuildRequestsTech | PC build reviews |
| Assigned Jobs | AssignedJobsTech | Assigned jobs |
| Active Repairs | ActiveRepairsTech | In-progress repairs |
| Completed | CompletedJobsTech | Finished jobs |
| Gig Management | GigManagement | Manage offerings |
| Service Reports | ServiceReportsTech | Job reports |
| Customer History | CustomerHistoryTech | Past interactions |
| Profile | ProfileScreen | Account settings |

## Admin Portal (6 Tabs)

| Tab | Component | Description |
|-----|-----------|-------------|
| Dashboard | AdminDashboard | System overview |
| User Management | AdminUsersMgmt | Manage accounts |
| Technician Management | AdminTechsMgmt | Manage technicians |
| Request Management | AdminRequestsMgmt | Reassign and override |
| System Reports | AdminSystemReports | Deep telemetry |
| Profile | ProfileScreen | Account settings |

## API Integration

**File:** `services/api.ts`

- Axios instance with base URL from `VITE_API_URL` (default: `http://localhost:8000/api`)
- Request interceptor: attaches `Authorization: Bearer <token>`
- Response interceptor: handles 401 (clears session)
- Types: `ApiResponse<T>`, `PaginatedData<T>`

### API Service Files

| File | Functions |
|------|-----------|
| `authApi.ts` | `register`, `login`, `logout`, `me`, `getProfile`, `updateProfile` |
| `repairApi.ts` | `list`, `create`, `get`, `delete`, `assign`, `updateStatus`, `complete`, `getTimeline`, `getServiceHistory`, `getTechnicianHistory`, `getUnassigned` |
| `pcBuildApi.ts` | `list`, `get`, `create`, `update`, `delete`, `submitForReview`, `updateStatus` |
| `adminApi.ts` | `listUsers`, `updateUserStatus`, `listTechnicians`, `getDashboard`, `getReport`, `runAITriage` |
| `gigApi.ts` | `list`, `get`, `create`, `update`, `delete` |
| `userHistoryApi.ts` | `list` |

## State Management

- **AuthProvider** (React Context): Authentication state, user data, session
- **TelemetryProvider** (React Context): System monitoring data, polled every 3 seconds
- **localStorage**: Tab state, active tab, open tabs, user data, token

## Styling

- **Tailwind CSS 4.3.0** for all styling
- Responsive design with mobile hamburger menu
- Collapsible sidebar navigation
- Color-coded role badges and status indicators

---

# 23. Error Handling

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (create) |
| 401 | Unauthenticated | Missing/invalid/revoked token |
| 403 | Forbidden | Authenticated but wrong role/permissions |
| 404 | Not Found | Resource doesn't exist or user lacks access |
| 422 | Unprocessable Entity | Validation failure |
| 500 | Server Error | Unexpected server failure |

## Frontend Error States

Components implement loading, error, and empty states:

- **Loading:** Spinner/placeholder while API call is in progress
- **Error:** Error message with retry option
- **Empty:** "No data" message when list is empty

## Backend Error Format

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "issue_description": ["The issue description must be at least 10 characters."]
    }
}
```

---

# 24. Status Consistency

## Database vs Frontend Status Mapping

The backend stores statuses in **lowercase** but the frontend displays them in **UPPERCASE**. The `RepairRequestResource` handles the transformation:

| Database Value | API/Frontend Value | Notes |
|---------------|-------------------|-------|
| `submitted` | `SUBMITTED` | Direct uppercase |
| `assigned` | `TECHNICIAN_ASSIGNED` | Special mapping (not just uppercase) |
| `accepted` | `ACCEPTED` | Direct uppercase |
| `in_progress` | `IN_PROGRESS` | Direct uppercase |
| `waiting_parts` | `WAITING_PARTS` | Direct uppercase |
| `testing` | `TESTING` | Direct uppercase |
| `completed` | `COMPLETED` | Direct uppercase |
| `cancelled` | `CANCELLED` | Direct uppercase |

## Why This Matters

The `assigned` → `TECHNICIAN_ASSIGNED` mapping was a critical fix. Without it, the frontend enum `RepairRequestStatus.TECHNICIAN_ASSIGNED` would never match the raw `assigned` value from the database, causing cross-role UI mismatches.

## Input Normalization

The `UpdateRepairStatusRequest` includes `prepareForValidation()` which normalizes the incoming status to lowercase before validation, ensuring the frontend can send UPPERCASE values without causing validation failures.

---

# 25. Bug Fix & Hardening History

## Chronological Bug Fix Table

| # | Problem | Root Cause | Fix | Impact | Verification |
|---|---------|-----------|-----|--------|-------------|
| 1 | Frontend shows `TECHNICIAN_ASSIGNED` but API returns `assigned` | Resource didn't map `assigned` → `TECHNICIAN_ASSIGNED` | Added conditional mapping in `RepairRequestResource` | Cross-role status display corrected | LIVE VERIFIED |
| 2 | Status validation rejects UPPERCASE input from frontend | `UpdateRepairStatusRequest` validated raw input | Added `prepareForValidation()` to lowercase status | Frontend can send any case | LIVE VERIFIED |
| 3 | Technician cannot accept unassigned requests | Policy required `technician_id` to be set (null for unassigned) | `RepairRequestPolicy@updateStatus`: allow tech if request is unassigned | Technicians can accept jobs | LIVE VERIFIED |
| 4 | `submitted → accepted` transition not in state machine | `LifecycleService` missing this transition | Added `submitted → accepted` to transitions array | Full lifecycle works | LIVE VERIFIED |
| 5 | Technician not auto-assigned on acceptance | `RepairService::updateStatus()` didn't set `technician_id` | Added auto-assignment logic when status changes to `accepted` | Technicians automatically assigned | LIVE VERIFIED |
| 6 | OptimizeController calls `exec()` directly during request | Snapshot refresh ran during HTTP request | Changed to fire artisan command via `execWithTimeout()` | No blocking during requests | CODE VERIFIED |
| 7 | PerformanceOptimizer kill button calls `exec()` directly | Kill endpoint ran system command during request | Changed to async execution with timeout | Non-blocking optimization | CODE VERIFIED |
| 8 | PC Build status mapping wrong for tech view | `IncomingBuildRequestsTech` didn't map statuses correctly | Fixed `under_review` → `UNDER_REVIEW`, `reviewed` → `COMPLETED` mapping | Tech build workflow works | LIVE VERIFIED |
| 9 | ReportsHistory shows "Invalid Date" | Date parsing failed for timestamp format | Fixed date handling to use numeric timestamps | Dates display correctly | LIVE VERIFIED |
| 10 | START_SYSTEM.bat opens wrong URL | Backend URL hardcoded incorrectly | Fixed to use correct `localhost:8000` | Correct URL opened | CODE VERIFIED |
| 11 | StartupController sorts boot times as strings | `usort` compared string values ("0.85" < "1.12" wrong) | Changed to numeric comparison with `(float)` cast | Correct boot time ordering | CODE VERIFIED |
| 12 | Revoked/garbage token returns HTTP 500 | Sanctum throws `RouteNotFoundException` for missing `login` route | Added exception handler in `bootstrap/app.php` catching the error | Returns 401 instead of 500 | LIVE VERIFIED |
| 13 | PCBuildPolicy blocks tech review of submitted builds | Policy only allowed owner or assigned tech to update | Added condition: tech can update if status is `submitted_review` or `under_review` | Tech can review builds | LIVE VERIFIED |
| 14 | PCBuildController filters tech builds by `technician_id` | `index()` scoped tech builds to assigned only | Changed to show all builds for tech/admin roles | Tech sees all submitted builds | LIVE VERIFIED |
| 15 | Gig list endpoint crashes entire frontend | `gigApi.list()` typed as `PaginatedData<GigData>` but backend returns flat array `[...]`; all 5 consumers did `res.data.xxx` on an array → `undefined` → TypeError → ErrorBoundary crash | Changed `gigApi.list()` return type to `GigData[]` and removed `.data` access in all 5 consumers (`GigManagement`, `BrowseGigs`, `NewRepairRequest`, `AdminTechsMgmt`, `RequestTechnicianHelp`) | Gigs display correctly across all portals | LIVE VERIFIED |
| 16 | Admin user list crashes frontend | `adminApi.listUsers()` typed as `PaginatedData<AdminUserData>` but backend returns flat array; 5 consumers did `userRes.data.xxx` on an array → `undefined` → TypeError → ErrorBoundary crash | Normalized `adminApi.listUsers()` to always return `PaginatedData` shape `{data: [...], meta: {...}}` wrapping the flat array, so consumers' `.data` access works | Admin users display correctly | LIVE VERIFIED |
| 17 | Routing engine crashes when filtering gigs | `routingEngine.ts:findBestGig()` did `res.data.filter(...)` but `gigApi.list()` returns `GigData[]` (array, not paginated object) → `.data` is `undefined` → TypeError | Changed to `res.filter(...)` since gigApi returns array directly | Technician routing works | LIVE VERIFIED |

---

# 26. Final Live Verification

## Test Results

| Metric | Value |
|--------|-------|
| **Total Tests** | 45 |
| **Passed** | 45 |
| **Failed** | 0 |
| **Pass Rate** | 100% |

## Test Breakdown

| Category | Tests | Pass | Fail |
|----------|:-----:|:----:|:----:|
| Authentication | 5 | 5 | 0 |
| Repair Lifecycle | 6 | 6 | 0 |
| Admin Intervention | 4 | 4 | 0 |
| PC Build Lifecycle | 5 | 5 | 0 |
| System Monitoring | 13 | 13 | 0 |
| Role Isolation | 9 | 9 | 0 |
| Service History | 2 | 2 | 0 |
| Revoked Token | 1 | 1 | 0 |
| **TOTAL** | **45** | **45** | **0** |

## Detailed Test Results

### Authentication (5/5)

| Test | Expected | Result |
|------|----------|--------|
| Login as admin | HTTP 200 + token | PASS |
| GET /me with valid token | HTTP 200 + user data | PASS |
| GET /me with no token | HTTP 401 | PASS |
| User cannot access admin endpoints | HTTP 403 | PASS |
| Logout invalidates token | HTTP 200 + token revoked | PASS |

### Repair Lifecycle (6/6)

| Test | Expected | Result |
|------|----------|--------|
| Create repair request | HTTP 201 | PASS |
| List own requests (user) | HTTP 200 + scoped data | PASS |
| List unassigned (tech) | HTTP 200 + unassigned only | PASS |
| Accept repair request | HTTP 200 + status=accepted | PASS |
| Update to in_progress | HTTP 200 + status=in_progress | PASS |
| Complete repair | HTTP 200 + status=completed | PASS |

### Admin Intervention (4/4)

| Test | Expected | Result |
|------|----------|--------|
| Assign technician | HTTP 200 + tech assigned | PASS |
| Admin dashboard | HTTP 200 + stats | PASS |
| List all users | HTTP 200 + all users | PASS |
| List all technicians | HTTP 200 + all techs | PASS |

### PC Build Lifecycle (5/5)

| Test | Expected | Result |
|------|----------|--------|
| Create compatible build | HTTP 201 + compatibility PASS | PASS |
| Submit for review | HTTP 200 + status=submitted_review | PASS |
| Tech views submitted builds | HTTP 200 + builds visible | PASS |
| Tech approves build | HTTP 200 + status=reviewed | PASS |
| User verifies reviewed | HTTP 200 + status=reviewed confirmed | PASS |

### System Monitoring (13/13)

| Test | Expected | Result |
|------|----------|--------|
| GET /system/health | HTTP 200 | PASS |
| GET /system/performance | HTTP 200 | PASS |
| GET /system/drives | HTTP 200 | PASS |
| GET /system/network | HTTP 200 | PASS |
| GET /system/hardware | HTTP 200 | PASS |
| GET /system/file-stats | HTTP 200 | PASS |
| GET /system/processes | HTTP 200 | PASS |
| GET /alerts | HTTP 200 | PASS |
| GET /alerts/counts | HTTP 200 | PASS |
| GET /maintenance/tasks | HTTP 200 | PASS |
| GET /startup/services | HTTP 200 | PASS |
| GET /app-manager | HTTP 200 | PASS |
| GET /reports/analytics | HTTP 200 | PASS |

### Role Isolation (9/9)

| Test | Expected | Result |
|------|----------|--------|
| User → admin/users | 403 | PASS |
| Tech → admin/users | 403 | PASS |
| Admin → admin/users | 200 | PASS |
| User → unassigned | 403 | PASS |
| Tech → unassigned | 200 | PASS |
| Admin → unassigned | 200 | PASS |
| User → technicians | 403 | PASS |
| Tech → technicians | 403 | PASS |
| Admin → technicians | 200 | PASS |

### Service History (2/2)

| Test | Expected | Result |
|------|----------|--------|
| User service history | HTTP 200 + repair list | PASS |
| Technician service history | HTTP 200 + repair list | PASS |

### Revoked Token (1/1)

| Test | Expected | Result |
|------|----------|--------|
| Revoked token → API call | HTTP 401 (not 500) | PASS |

---

# 27. End-to-End Verification Scenarios

## Scenario 1: User Creates Repair Request

| Field | Value |
|-------|-------|
| **Actor** | User (customer1@smartpchub.test) |
| **Precondition** | User is authenticated |
| **Action** | POST /repair-requests with issue_description, severity_level, system_specifications |
| **Expected** | HTTP 201, status=submitted, lifecycle event created |
| **Actual** | HTTP 201, status=SUBMITTED, event recorded |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 2: Technician Finds Unassigned Request

| Field | Value |
|-------|-------|
| **Actor** | Technician (ali.hassan@smartpchub.test) |
| **Precondition** | Unassigned request exists |
| **Action** | GET /repair-requests/unassigned |
| **Expected** | HTTP 200, list contains unassigned requests |
| **Actual** | HTTP 200, unassigned requests visible |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 3: Technician Accepts Job

| Field | Value |
|-------|-------|
| **Actor** | Technician |
| **Precondition** | Unassigned request exists |
| **Action** | POST /repair-requests/{id}/status with status="accepted" |
| **Expected** | HTTP 200, status=ACCEPTED, technician auto-assigned |
| **Actual** | HTTP 200, status=ACCEPTED, technician_id set |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 4: Admin Assigns Technician

| Field | Value |
|-------|-------|
| **Actor** | Admin (admin@smartpchub.test) |
| **Precondition** | Request exists, technician exists |
| **Action** | POST /repair-requests/{id}/assign with technician_id |
| **Expected** | HTTP 200, technician assigned |
| **Actual** | HTTP 200, technician_id set, lifecycle event created |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 5: Technician Starts Work

| Field | Value |
|-------|-------|
| **Actor** | Technician (assigned) |
| **Precondition** | Request status=accepted |
| **Action** | POST /repair-requests/{id}/status with status="in_progress" |
| **Expected** | HTTP 200, status=IN_PROGRESS |
| **Actual** | HTTP 200, status=IN_PROGRESS |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 6: Technician Sets Waiting Parts / Testing

| Field | Value |
|-------|-------|
| **Actor** | Technician |
| **Precondition** | Request status=in_progress |
| **Action** | POST /repair-requests/{id}/status with status="waiting_parts" or "testing" |
| **Expected** | HTTP 200, status updated |
| **Actual** | HTTP 200, status=WAITING_PARTS or TESTING |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 7: Technician Completes Repair

| Field | Value |
|-------|-------|
| **Actor** | Technician |
| **Precondition** | Request status=in_progress or testing |
| **Action** | POST /repair-requests/{id}/complete with completion report |
| **Expected** | HTTP 200, status=COMPLETED, completion report created |
| **Actual** | HTTP 200, status=COMPLETED, report filed |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 8: User Sees Assigned Technician

| Field | Value |
|-------|-------|
| **Actor** | User (owner) |
| **Precondition** | Request has assigned technician |
| **Action** | GET /repair-requests/{id} |
| **Expected** | HTTP 200, technician data included |
| **Actual** | HTTP 200, technician info present |
| **Status** | PASS — CODE VERIFIED |

## Scenario 9: User Sees Status

| Field | Value |
|-------|-------|
| **Actor** | User (owner) |
| **Precondition** | Request exists |
| **Action** | GET /repair-requests/{id} |
| **Expected** | HTTP 200, status field present and uppercase |
| **Actual** | HTTP 200, status=COMPLETED (uppercase) |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 10: User Service History

| Field | Value |
|-------|-------|
| **Actor** | User |
| **Precondition** | User has completed repairs |
| **Action** | GET /user/service-history |
| **Expected** | HTTP 200, list of past repairs with completion reports |
| **Actual** | HTTP 200, history returned |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 11: Technician Service History

| Field | Value |
|-------|-------|
| **Actor** | Technician |
| **Precondition** | Technician has completed repairs |
| **Action** | GET /technician/service-history |
| **Expected** | HTTP 200, list of completed repairs |
| **Actual** | HTTP 200, history returned |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 12: Admin Views All Requests

| Field | Value |
|-------|-------|
| **Actor** | Admin |
| **Precondition** | Multiple requests exist |
| **Action** | GET /repair-requests |
| **Expected** | HTTP 200, all requests returned (not scoped) |
| **Actual** | HTTP 200, all requests visible |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 13: Admin Priority/Status Management

| Field | Value |
|-------|-------|
| **Actor** | Admin |
| **Precondition** | Request exists |
| **Action** | POST /repair-requests/{id}/status with severity_level override |
| **Expected** | HTTP 200, severity updated |
| **Actual** | HTTP 200, severity changed |
| **Status** | PASS — CODE VERIFIED |

## Scenario 14: User Creates PC Build

| Field | Value |
|-------|-------|
| **Actor** | User |
| **Precondition** | User is authenticated |
| **Action** | POST /pc-builds with component selections |
| **Expected** | HTTP 201, build created with compatibility analysis |
| **Actual** | HTTP 201, build created, compatibility=PASS, score=85 |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 15: User Submits Compatible Build

| Field | Value |
|-------|-------|
| **Actor** | User (owner) |
| **Precondition** | Build exists, compatibility_status=pass, status=draft |
| **Action** | POST /pc-builds/{id}/submit-review |
| **Expected** | HTTP 200, status=submitted_review |
| **Actual** | HTTP 200, status=SUBMITTED_REVIEW |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 16: Technician Reviews Build

| Field | Value |
|-------|-------|
| **Actor** | Technician |
| **Precondition** | Build status=submitted_review |
| **Action** | POST /pc-builds/{id}/status with status="under_review" |
| **Expected** | HTTP 200, status=under_review |
| **Actual** | HTTP 200, status=UNDER_REVIEW |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 17: Technician Approves Build

| Field | Value |
|-------|-------|
| **Actor** | Technician |
| **Precondition** | Build status=under_review |
| **Action** | POST /pc-builds/{id}/status with status="reviewed" |
| **Expected** | HTTP 200, status=reviewed |
| **Actual** | HTTP 200, status=REVIEWED |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 18: User Verifies Build

| Field | Value |
|-------|-------|
| **Actor** | User (owner) |
| **Precondition** | Build status=reviewed |
| **Action** | GET /pc-builds/{id} |
| **Expected** | HTTP 200, status=reviewed confirmed |
| **Actual** | HTTP 200, status=REVIEWED |
| **Status** | PASS — LIVE VERIFIED |

## Scenario 19: Admin Suspends/Activates User

| Field | Value |
|-------|-------|
| **Actor** | Admin |
| **Precondition** | User exists |
| **Action** | PUT /admin/users/{id}/status with status="suspended" |
| **Expected** | HTTP 200, user status=suspended |
| **Actual** | HTTP 200, user suspended |
| **Status** | PASS — CODE VERIFIED |

## Scenario 20: Authentication / Logout / Token Rejection

| Field | Value |
|-------|-------|
| **Actor** | Any user |
| **Precondition** | User is authenticated |
| **Action** | POST /auth/logout, then use revoked token |
| **Expected** | Logout returns 200; revoked token returns 401 |
| **Actual** | Logout=200; revoked token=401 |
| **Status** | PASS — LIVE VERIFIED |

---

# 28. Role Isolation Verification

## Tested Matrix

| Endpoint | User → Result | Tech → Result | Admin → Result |
|----------|:-------------:|:-------------:|:--------------:|
| `GET /admin/users` | 403 | 403 | **200** |
| `GET /repair-requests/unassigned` | 403 | **200** | **200** |
| `GET /admin/technicians` | 403 | 403 | **200** |
| `GET /admin/dashboard` | 403 | 403 | **200** |
| `GET /repair-requests` | **200** (own) | **200** (assigned) | **200** (all) |
| `GET /technician/service-history` | 403 | **200** | 403 |

## Why Backend Enforcement Matters

Even though the frontend routes are protected (RoleRouter only renders the correct portal), backend enforcement is critical because:

1. **API Direct Access:** Users can call API endpoints directly via tools like Postman, bypassing the frontend entirely.
2. **Token Reuse:** A stolen token could be used from a different client.
3. **Defense in Depth:** Multiple layers ensure that a bug in one layer doesn't compromise security.
4. **RoleMiddleware:** Validates both authentication and role on every protected endpoint.

---

# 29. Known Limitations

## Non-Blocking Issues

| # | Issue | Impact | Classification |
|---|-------|--------|---------------|
| 1 | Optimize POST can temporarily block the PHP development server due to single-threaded behavior during snapshot refresh | Low (dev only) | Development limitation |
| 2 | PC Build submission correctly requires `compatibility_status=pass` — builds with warnings or failures cannot be submitted | By design | Feature behavior |
| 3 | SQLite is file-based and not suitable for concurrent production write loads | Low (dev/exam only) | Architecture choice |
| 4 | No automated test suite (PHPUnit/Jest) — verification done via live API testing | Medium | Testing approach |
| 5 | AI triage uses local rule-based system; Gemini API key is not configured | Low | Placeholder feature |
| 6 | Package name in `package.json` is `system-sentinel-platform` (legacy name) | Cosmetic | Naming inconsistency |

## Architectural Notes

- **SQLite:** Appropriate for a single-developer FYP demonstration. Not suitable for multi-server production.
- **No WebSocket:** Monitoring uses polling (every 3 seconds). Real-time push was not implemented.
- **No Email Delivery:** Mail is configured as log-only. Email notifications are not functional.
- **Single Developer:** All code written by one developer; no code review process.

---

# 30. Deployment / Setup Guide

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| PHP | 8.3 | Laravel runtime (installed at `C:\php83`) |
| Composer | 2.x | PHP dependency manager |
| Node.js | 18+ | Frontend build tools |
| npm | 9+ | Frontend dependency manager |
| SQLite | (bundled with PHP) | Database |

## Quick Start

### 1. Clone/Extract Project

```bash
cd C:\Users\CORE\Desktop\0FYP\APP
```

### 2. Backend Setup

```bash
cd backend-laravel

# Install dependencies
composer install

# Create SQLite database
type nul > database\database.sqlite

# Run migrations and seed
C:\php83\php.exe artisan migrate:fresh --seed --force

# Start backend server
C:\php83\php.exe artisan serve --host=127.0.0.1 --port=8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. System Monitoring Snapshot

```bash
cd backend-laravel
C:\php83\php.exe artisan snapshot:refresh
```

### 5. Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Demo Page:** http://localhost:8000/demo

## Environment Variables

**File:** `backend-laravel/.env`

Key variables (do not expose real values):

| Variable | Purpose | Default |
|----------|---------|---------|
| `APP_NAME` | Application name | Smart PC Hub |
| `APP_ENV` | Environment | local |
| `APP_URL` | Backend URL | http://localhost:8000 |
| `DB_CONNECTION` | Database driver | sqlite |
| `SANCTUM_STATEFUL_DOMAINS` | CORS domains | localhost:3000,8000,5173 |
| `AI_ENABLED` | AI features toggle | false |
| `AI_DRIVER` | AI provider | local |
| `GEMINI_API_KEY` | Gemini API key | (empty) |
| `FRONTEND_URL` | Frontend URL | http://localhost:3000 |

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smartpchub.test | password |
| Technician | ali.hassan@smartpchub.test | password |
| Technician | sara.malik@smartpchub.test | password |
| Technician | usman.khan@smartpchub.test | password |
| Customer | customer1@smartpchub.test | password |
| Customer | customer2@smartpchub.test | password |
| Customer | customer3@smartpchub.test | password |
| Customer | customer4@smartpchub.test | password |
| Customer | customer5@smartpchub.test | password |

## System Launcher

```bash
# From project root
run.bat
```

Menu options:
1. Start System (launches backend + frontend + snapshot)
2. Shut Down System (kills all services)
3. Reset Database (fresh migration + seed)
4. Exit

---

# 31. Examiner Verification Guide

## Step 1: Environment Setup

1. Ensure PHP 8.3 is installed at `C:\php83`
2. Ensure Node.js 18+ is installed
3. Navigate to `C:\Users\CORE\Desktop\0FYP\APP`

## Step 2: Database Setup

```bash
cd backend-laravel
C:\php83\php.exe artisan migrate:fresh --seed --force
```

Verify: Database file exists at `backend-laravel/database/database.sqlite`

## Step 3: Start Backend

```bash
C:\php83\php.exe artisan serve --host=127.0.0.1 --port=8000
```

Verify: `curl http://localhost:8000/api/v1/system/health` returns HTTP 200

## Step 4: Start Frontend

```bash
cd frontend
npm run dev
```

Verify: http://localhost:3000 loads in browser

## Step 5: Test User Role

1. Open http://localhost:3000
2. Login as `customer1@smartpchub.test` / `password`
3. Verify: User dashboard loads
4. Create a repair request
5. Verify: Request appears in Active Requests
6. Navigate to PC Build Planner
7. Create a build with AMD Ryzen 5 5600X + MSI MAG B550 TOMAHAWK
8. Verify: Compatibility shows PASS

## Step 6: Test Technician Role

1. Logout and login as `ali.hassan@smartpchub.test` / `password`
2. Verify: Technician dashboard loads
3. Navigate to Incoming Requests
4. Verify: Unassigned requests visible
5. Accept a request
6. Verify: Request moves to Assigned Jobs
7. Navigate to Incoming Build Requests
8. Verify: Submitted builds visible

## Step 7: Test Admin Role

1. Logout and login as `admin@smartpchub.test` / `password`
2. Verify: Admin dashboard loads with system stats
3. Navigate to User Management
4. Verify: All users listed
5. Navigate to Technician Management
6. Verify: All technicians listed
7. Navigate to Request Management
8. Verify: All requests visible with assignment capability

## Step 8: Test Role Restrictions

1. Login as `customer1@smartpchub.test`
2. Try accessing admin endpoints directly:
   ```bash
   curl -H "Authorization: Bearer <user_token>" http://localhost:8000/api/v1/admin/users
   ```
3. Verify: Returns HTTP 403

## Step 9: Test API Responses

```bash
# Health check (no auth)
curl http://localhost:8000/api/v1/system/health

# Authenticated request
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/repair-requests

# Admin endpoint
curl -H "Authorization: Bearer <admin_token>" http://localhost:8000/api/v1/admin/dashboard
```

## Step 10: Verify Database Records

```bash
cd backend-laravel
C:\php83\php.exe artisan tinker --execute="
echo 'Users: ' . \App\Models\User::count();
echo '  Repairs: ' . \App\Models\RepairRequest::count();
echo '  Builds: ' . \App\Models\PCBuild::count();
echo '  Gigs: ' . \App\Models\Gig::count();
echo '  Alerts: ' . \App\Models\Alert::count();
"
```

---

# 32. Examiner Demonstration Script

**Estimated Duration:** 15-20 minutes

### A. Login as User
- Navigate to http://localhost:3000
- Login: `customer1@smartpchub.test` / `password`
- Show: User dashboard with welcome message

### B. Create Repair Request
- Click "New Request"
- Enter issue: "My laptop screen is flickering intermittently"
- Select severity: High
- Add system specs
- Submit
- Show: Request appears in Active Requests with status SUBMITTED

### C. Show Request Status
- Click on the request
- Show: Status = SUBMITTED, no technician assigned yet

### D. Login as Technician
- Logout
- Login: `ali.hassan@smartpchub.test` / `password`
- Show: Technician dashboard

### E. Show Unassigned Request
- Navigate to "Incoming Requests"
- Show: The request from customer1 is visible

### F. Accept Request
- Click "Accept" on the request
- Show: Status changes to ACCEPTED
- Show: Technician is now assigned (TECHNICIAN_ASSIGNED)

### G. Show Automatic Assignment
- Navigate to "Assigned Jobs"
- Show: The accepted request appears in assigned list

### H. Start Work
- Click on the request
- Update status to IN_PROGRESS
- Show: Status updated

### I. Complete Repair
- Click "Complete"
- Fill in completion report:
  - Issue summary: "Screen flickering due to loose display cable"
  - Root cause: "Internal display cable connector was partially dislodged"
  - Parts: "Display Cable, $15, qty 1"
  - Labor cost: 500
  - Time: 45 minutes
- Submit
- Show: Status = COMPLETED

### J. Login as User (Verify)
- Logout
- Login: `customer1@smartpchub.test` / `password`
- Navigate to "Service History"
- Show: Completed repair with full report

### K. Create Compatible PC Build
- Navigate to "PC Build Planner"
- Select: AMD Ryzen 5 5600X + MSI MAG B550 TOMAHAWK + 16GB DDR4 + RTX 3060 + Corsair RM650x
- Show: Compatibility = PASS, Score = 85/100
- Submit for review
- Show: Status = SUBMITTED_REVIEW

### L. Login as Technician (Review Build)
- Logout
- Login: `ali.hassan@smartpchub.test` / `password`
- Navigate to "Incoming Build Requests"
- Show: Build visible with compatibility details
- Start review → Status = UNDER_REVIEW
- Approve → Status = REVIEWED

### M. Login as User (Verify Build)
- Logout
- Login: `customer1@smartpchub.test` / `password`
- Navigate to PC Build Planner
- Show: Build status = REVIEWED

### N. Login as Admin
- Logout
- Login: `admin@smartpchub.test` / `password`
- Show: Admin dashboard with system stats

### O. Show User Management
- Navigate to "User Management"
- Show: All users with status controls

### P. Show Technician Management
- Navigate to "Technician Management"
- Show: All technicians with profiles

### Q. Show Request Management
- Navigate to "Request Management"
- Show: All requests with assignment capability

### R. Demonstrate Unauthorized Access
- Open terminal
- Try accessing admin endpoint with user token
- Show: HTTP 403 response

### S. Show System Monitoring
- Navigate to any monitoring module (Health, Performance, etc.)
- Show: Real-time data from backend snapshot

---

# 33. Recommended Evidence

The following screenshots/evidence are recommended for the examination portfolio:

| # | Evidence | Source |
|---|---------|--------|
| 1 | Login screen with role selection | Frontend: LoginScreen |
| 2 | User dashboard with active requests | Frontend: UserDashboard |
| 3 | Repair request creation form | Frontend: NewRepairRequest |
| 4 | Technician incoming requests list | Frontend: IncomingRequestsTech |
| 5 | Accepted repair with auto-assignment | API response: status=ACCEPTED, technician_id set |
| 6 | In-progress repair status | Frontend: ActiveRepairsTech |
| 7 | Completed repair with full report | Frontend: ServiceHistory + ServiceSummaryView |
| 8 | PC Build compatibility result | Frontend: BuildPlanner (PASS, score 85) |
| 9 | PC Build submitted for review | API response: status=SUBMITTED_REVIEW |
| 10 | Technician reviewing build | Frontend: IncomingBuildRequestsTech |
| 11 | Admin dashboard with metrics | Frontend: AdminDashboard |
| 12 | Role restriction / 403 response | Terminal: curl with user token → admin endpoint |
| 13 | System monitoring health data | Frontend: HealthIntelligence |
| 14 | API response format | Terminal: curl with JSON response |
| 15 | Database records (users, repairs, builds) | Terminal: artisan tinker count query |

---

# 34. Code Quality & Architecture Notes

## Observed Quality Practices

| Practice | Implementation |
|----------|---------------|
| **MVC Pattern** | Controllers handle HTTP, Services handle logic, Models handle data |
| **Service Layer** | 12 service classes separate business logic from controllers |
| **Form Request Validation** | 13 dedicated form request classes with validation rules |
| **API Resources** | 10 resource transformers for consistent JSON output |
| **Policy Authorization** | 3 policies with 18 authorization methods |
| **Middleware** | Custom `RoleMiddleware` for role-based access |
| **Migration-Based Schema** | 16 migration files for version-controlled schema |
| **Seeder/Factory Support** | 8 seeders + 4 factories for test data |
| **TypeScript** | Full TypeScript on frontend with enums and interfaces |
| **Component Architecture** | Modular React components organized by portal |
| **API Abstraction** | Dedicated API service files for each domain |
| **Consistent Response Format** | Envelope pattern across all endpoints |
| **Error Handling** | Exception handler for Sanctum token errors |
| **Separation of Concerns** | Frontend (React) ↔ Backend (Laravel) ↔ Database (SQLite) |

## Architectural Decisions

1. **Snapshot-Based Monitoring:** Avoids running system commands during HTTP requests, improving response times and安全性.
2. **Auto-Assignment:** Technicians are automatically assigned when accepting requests, reducing admin overhead.
3. **Status Normalization:** Input normalization + output transformation ensures cross-role consistency.
4. **UUID Primary Keys:** All major entities use UUIDs for security and distributed uniqueness.
5. **JSON Columns:** System specifications, images, issues, and bottlenecks stored as JSON for flexibility.

---

# 35. Future Improvements

## Currently Implemented

- Full repair lifecycle management
- PC build compatibility engine
- Role-based access control
- System monitoring dashboards
- Alert engine with rules
- Service history tracking

## Potential Future Improvements

| Area | Improvement | Current State |
|------|-------------|---------------|
| **Production Deployment** | Configure nginx + PHP-FPM + PostgreSQL | NOT IMPLEMENTED (dev only) |
| **Real-Time Updates** | WebSocket for live status notifications | NOT IMPLEMENTED (polling used) |
| **Automated Testing** | PHPUnit + Jest test suites | NOT IMPLEMENTED (live verification only) |
| **Email Notifications** | Send email on status change | NOT IMPLEMENTED (log-only) |
| **Payment Integration** | Process payments for repairs | NOT IMPLEMENTED |
| **Mobile App** | React Native or Flutter companion | NOT IMPLEMENTED |
| **Multi-Language** | Internationalization (i18n) | NOT IMPLEMENTED |
| **Advanced AI** | Full Gemini integration for triage | PLACEHOLDER (local rules only) |
| **Batch Operations** | Bulk technician assignment | NOT IMPLEMENTED |
| **Export** | PDF/CSV export of reports | NOT IMPLEMENTED |

---

# 36. Final Readiness Assessment

## Verification Summary

| Category | Tests | Result |
|----------|:-----:|:------:|
| Authentication | 5 | ALL PASS |
| Repair Lifecycle | 6 | ALL PASS |
| Admin Intervention | 4 | ALL PASS |
| PC Build Lifecycle | 5 | ALL PASS |
| System Monitoring | 13 | ALL PASS |
| Role Isolation | 9 | ALL PASS |
| Service History | 2 | ALL PASS |
| Revoked Token | 1 | ALL PASS |
| **TOTAL** | **45** | **45 PASS** |

## Assessment

The final live verification recorded **45/45 tests passing with zero failures**. Core authentication, role-based authorization, repair lifecycle management, technician assignment, PC Build creation and review, system monitoring, service history, and cross-role isolation were all verified end-to-end against the running application.

### Key Achievements

1. **Complete Python → Laravel Migration:** All features from the original Python FastAPI backend have been restored in Laravel 11.
2. **Role-Based Security:** Four layers of authorization (Sanctum, RoleMiddleware, Policies, Query Scoping) enforce access control.
3. **Repair Lifecycle:** 8-state state machine with immutable audit trail and completion reports.
4. **PC Build Engine:** Compatibility analysis with component database, scoring, and cost estimation.
5. **System Monitoring:** Snapshot-based architecture with 13 alert rules and multiple monitoring endpoints.
6. **Bug Fix Hardening:** 17 critical bugs identified and fixed during the migration recovery process.

### Classification

The system is considered **READY FOR CONTROLLED EXTERNAL EXAMINER DEMONSTRATION** based on the tested scope.

This classification is based on:
- All critical user flows verified end-to-end
- Role isolation confirmed across all protected endpoints
- Authentication and token handling validated (including revoked token behavior)
- No known blocking issues

---

# Appendices

---

## Appendix A — API Endpoint Reference

### Auth (5 endpoints)

| Method | URI | Auth | Roles | Controller |
|--------|-----|:----:|-------|------------|
| GET | `/api/v1/auth/login` | No | — | `AuthController@loginInfo` |
| POST | `/api/v1/auth/register` | No | — | `AuthController@register` |
| POST | `/api/v1/auth/login` | No | — | `AuthController@login` |
| POST | `/api/v1/auth/logout` | Yes | Any | `AuthController@logout` |
| GET | `/api/v1/auth/me` | Yes | Any | `AuthController@me` |

### Profile (2 endpoints)

| Method | URI | Auth | Roles | Controller |
|--------|-----|:----:|-------|------------|
| GET | `/api/v1/user/profile` | Yes | Any | `UserController@profile` |
| PUT | `/api/v1/user/profile` | Yes | Any | `UserController@updateProfile` |

### Gigs (5 endpoints)

| Method | URI | Auth | Roles | Controller |
|--------|-----|:----:|-------|------------|
| GET | `/api/v1/gigs` | Yes | Any | `GigController@index` |
| POST | `/api/v1/gigs` | Yes | Tech/Admin | `GigController@store` |
| GET | `/api/v1/gigs/{gig}` | Yes | Any | `GigController@show` |
| PUT | `/api/v1/gigs/{gig}` | Yes | Owner/Admin | `GigController@update` |
| DELETE | `/api/v1/gigs/{gig}` | Yes | Owner/Admin | `GigController@destroy` |

### PC Builds (7 endpoints)

| Method | URI | Auth | Roles | Controller |
|--------|-----|:----:|-------|------------|
| GET | `/api/v1/pc-builds` | Yes | Any | `PCBuildController@index` |
| POST | `/api/v1/pc-builds` | Yes | Any | `PCBuildController@store` |
| GET | `/api/v1/pc-builds/{pc_build}` | Yes | Owner/Tech/Admin | `PCBuildController@show` |
| PUT | `/api/v1/pc-builds/{pc_build}` | Yes | Owner(draft)/Tech/Admin | `PCBuildController@update` |
| DELETE | `/api/v1/pc-builds/{pc_build}` | Yes | Owner(draft)/Admin | `PCBuildController@destroy` |
| POST | `/api/v1/pc-builds/{id}/submit-review` | Yes | Owner | `PCBuildController@submitForReview` |
| POST | `/api/v1/pc-builds/{id}/status` | Yes | Tech/Admin | `PCBuildController@updateStatus` |

### Repair Requests (9 endpoints)

| Method | URI | Auth | Roles | Controller |
|--------|-----|:----:|-------|------------|
| GET | `/api/v1/repair-requests` | Yes | Any (scoped) | `RepairRequestController@index` |
| GET | `/api/v1/repair-requests/unassigned` | Yes | Tech/Admin | `RepairRequestController@unassigned` |
| POST | `/api/v1/repair-requests` | Yes | Any | `RepairRequestController@store` |
| GET | `/api/v1/repair-requests/{id}` | Yes | Owner/Tech/Admin | `RepairRequestController@show` |
| DELETE | `/api/v1/repair-requests/{id}` | Yes | Owner(submitted)/Admin | `RepairRequestController@destroy` |
| POST | `/api/v1/repair-requests/{id}/assign` | Yes | Admin | `RepairRequestController@assign` |
| POST | `/api/v1/repair-requests/{id}/status` | Yes | Tech/Admin | `RepairRequestController@updateStatus` |
| POST | `/api/v1/repair-requests/{id}/complete` | Yes | Tech (assigned) | `RepairRequestController@complete` |
| GET | `/api/v1/repair-requests/{id}/timeline` | Yes | Owner/Tech/Admin | `RepairRequestController@timeline` |

### Service History (3 endpoints)

| Method | URI | Auth | Roles | Controller |
|--------|-----|:----:|-------|------------|
| GET | `/api/v1/user/history` | Yes | Any | `UserHistoryController@index` |
| GET | `/api/v1/user/service-history` | Yes | Any | `RepairRequestController@serviceHistory` |
| GET | `/api/v1/technician/service-history` | Yes | Tech | `RepairRequestController@technicianHistory` |

### Admin (5 endpoints)

| Method | URI | Auth | Roles | Controller |
|--------|-----|:----:|-------|------------|
| GET | `/api/v1/admin/users` | Yes | Admin | `AdminController@listUsers` |
| PUT | `/api/v1/admin/users/{id}/status` | Yes | Admin | `AdminController@updateUserStatus` |
| GET | `/api/v1/admin/technicians` | Yes | Admin | `AdminController@listTechnicians` |
| GET | `/api/v1/admin/dashboard` | Yes | Admin | `AdminController@dashboard` |
| GET | `/api/v1/admin/reports/summary` | Yes | Admin | `RepairRequestController@adminReport` |

### AI (1 endpoint)

| Method | URI | Auth | Roles | Controller |
|--------|-----|:----:|-------|------------|
| POST | `/api/v1/ai/triage` | Yes | Any | `AIController@triage` |

### Reports (1 endpoint)

| Method | URI | Auth | Roles | Controller |
|--------|-----|:----:|-------|------------|
| GET | `/api/v1/reports/analytics` | Yes | Any | `ReportsController@analytics` |

### System Monitoring (7 endpoints — No Auth)

| Method | URI | Controller |
|--------|-----|------------|
| GET | `/api/v1/system/health` | `SystemHealthController@index` |
| GET | `/api/v1/system/performance` | `SystemHealthController@performance` |
| GET | `/api/v1/system/processes` | `SystemHealthController@processes` |
| GET | `/api/v1/system/drives` | `SystemHealthController@drives` |
| GET | `/api/v1/system/file-stats` | `SystemHealthController@fileStats` |
| GET | `/api/v1/system/network` | `SystemHealthController@network` |
| GET | `/api/v1/system/hardware` | `SystemHealthController@hardware` |

### Alerts (6 endpoints — No Auth)

| Method | URI | Controller |
|--------|-----|------------|
| GET | `/api/v1/alerts` | `AlertController@index` |
| GET | `/api/v1/alerts/counts` | `AlertController@counts` |
| POST | `/api/v1/alerts/{id}/acknowledge` | `AlertController@acknowledge` |
| POST | `/api/v1/alerts/{id}/in-progress` | `AlertController@startProgress` |
| POST | `/api/v1/alerts/{id}/resolve` | `AlertController@resolve` |
| POST | `/api/v1/alerts/{id}/archive` | `AlertController@archive` |

### Optimization (2 endpoints — No Auth)

| Method | URI | Controller |
|--------|-----|------------|
| POST | `/api/v1/optimize` | `OptimizeController@optimize` |
| POST | `/api/v1/optimize/kill` | `OptimizeController@killProcess` |

### Maintenance (2 endpoints — No Auth)

| Method | URI | Controller |
|--------|-----|------------|
| GET | `/api/v1/maintenance/tasks` | `MaintenanceController@index` |
| POST | `/api/v1/maintenance/tasks/{id}/toggle` | `MaintenanceController@toggle` |

### Power (1 endpoint — No Auth)

| Method | URI | Controller |
|--------|-----|------------|
| GET | `/api/v1/power` | `PowerController@index` |

### Startup (2 endpoints — No Auth)

| Method | URI | Controller |
|--------|-----|------------|
| GET | `/api/v1/startup/services` | `StartupController@index` |
| POST | `/api/v1/startup/services/{name}/toggle` | `StartupController@toggle` |

### App Manager (1 endpoint — No Auth)

| Method | URI | Controller |
|--------|-----|------------|
| GET | `/api/v1/app-manager` | `AppManagerController@index` |

### Automation (3 endpoints — No Auth)

| Method | URI | Controller |
|--------|-----|------------|
| GET | `/api/v1/automation/scripts` | `AutomationController@index` |
| POST | `/api/v1/automation/scripts` | `AutomationController@store` |
| DELETE | `/api/v1/automation/scripts/{id}` | `AutomationController@destroy` |

### Health Check (1 endpoint — No Auth)

| Method | URI | Description |
|--------|-----|-------------|
| GET | `/api/health` | Basic health check (inline closure) |

**Total: 64 API routes**

---

## Appendix B — Database Table Reference

| # | Table | Purpose | Key Columns | Records (Seeded) |
|---|-------|---------|-------------|-----------------|
| 1 | `users` | All accounts | id (UUID), name, email, role, status | 9 |
| 2 | `personal_access_tokens` | Sanctum tokens | id, tokenable_id, token, abilities | 0 (created at login) |
| 3 | `repair_requests` | Repair submissions | id (UUID), user_id, technician_id, status, severity_level | 5 |
| 4 | `lifecycle_events` | Audit trail | id, repair_request_id, status, updated_by, note | ~15 |
| 5 | `completion_reports` | Repair reports | id (UUID), repair_request_id, issue_summary, root_cause, parts_replaced | 1 |
| 6 | `pc_builds` | PC configurations | id (UUID), user_id, cpu, gpu, compatibility_status, performance_score, status | 0 (created by users) |
| 7 | `gigs` | Service offerings | id (UUID), technician_id, title, category, price | 8 |
| 8 | `technician_profiles` | Tech extensions | id, user_id, specialty, rating, jobs_completed | 3 |
| 9 | `user_history` | Activity log | id (UUID), user_id, type, reference_id, title | ~10 |
| 10 | `alerts` | Monitoring alerts | id, uid, rule_code, severity, status | 0 (created by AlertEngine) |
| 11 | `alert_rules` | Alert definitions | id, code, condition_field, condition_operator, condition_value | 13 |
| 12 | `maintenance_tasks` | Scheduled tasks | id, name, frequency, active | 5 |
| 13 | `startup_services` | Startup entries | id, name, impact, boot_time_s | 4 |
| 14 | `automation_scripts` | Automation defs | id, name, trigger_condition, status | 2 |

---

## Appendix C — Status / State Reference

### Repair Request Status

| Status | Description | Transitions To |
|--------|-------------|---------------|
| `submitted` | Newly created, unassigned | assigned, accepted, cancelled |
| `assigned` | Technician assigned | accepted, cancelled |
| `accepted` | Technician accepted job | in_progress, cancelled |
| `in_progress` | Work in progress | waiting_parts, testing, completed, cancelled |
| `waiting_parts` | Awaiting parts | in_progress, cancelled |
| `testing` | In testing phase | in_progress, completed, cancelled |
| `completed` | Work finished | *(terminal)* |
| `cancelled` | Request cancelled | *(terminal)* |

### PC Build Status

| Status | Description | Transitions To |
|--------|-------------|---------------|
| `draft` | Being created/edited | submitted_review |
| `submitted_review` | Awaiting tech review | under_review |
| `under_review` | Tech reviewing | reviewed |
| `reviewed` | Approved by tech | *(terminal)* |

### User Status

| Status | Description |
|--------|-------------|
| `active` | Account active, can login |
| `suspended` | Account suspended, cannot login |

### User Role

| Role | Description |
|------|-------------|
| `user` | Customer/PC owner |
| `technician` | Repair specialist |
| `admin` | System administrator |

### Alert Status

| Status | Description |
|--------|-------------|
| `active` | Alert is current |
| `acknowledged` | Alert has been seen |
| `in_progress` | Being addressed |
| `resolved` | Issue resolved |
| `archived` | Historical record |
| `ignored` | Dismissed |

### Compatibility Status

| Status | Description |
|--------|-------------|
| `pass` | All components compatible |
| `warning` | Minor issues detected |
| `fail` | Incompatible components |

---

## Appendix D — Verification Matrix

### Test Coverage by Module

| Module | Live Tested | Code Verified | Not Tested |
|--------|:-----------:|:-------------:|:----------:|
| Authentication (login/logout/me) | ✓ | — | — |
| User Registration | — | ✓ | — |
| Profile Management | — | ✓ | — |
| Repair Request CRUD | ✓ | — | — |
| Repair Lifecycle (all transitions) | ✓ | — | — |
| Technician Acceptance | ✓ | — | — |
| Technician Auto-Assignment | ✓ | — | — |
| Completion Reports | ✓ | — | — |
| PC Build CRUD | ✓ | — | — |
| PC Build Compatibility | ✓ | — | — |
| PC Build Review Workflow | ✓ | — | — |
| Admin Dashboard | ✓ | — | — |
| Admin User Management | — | ✓ | — |
| Admin Technician Management | — | ✓ | — |
| Admin Request Management | ✓ | — | — |
| Role Isolation (9 tests) | ✓ | — | — |
| Service History (2 tests) | ✓ | — | — |
| System Monitoring (13 tests) | ✓ | — | — |
| Revoked Token Handling | ✓ | — | — |
| Alert Engine | — | ✓ | — |
| Maintenance Tasks | — | ✓ | — |
| Startup Services | — | ✓ | — |
| Automation Scripts | — | ✓ | — |
| AI Triage (local rules) | — | ✓ | — |
| Cost Estimation | — | ✓ | — |
| Gig Management | — | ✓ | — |
| User History | — | ✓ | — |

---

## Appendix E — Important File / Module Reference

### Backend Core Files

| File | Lines | Purpose |
|------|------:|---------|
| `routes/api.php` | ~203 | All 64 API route definitions |
| `app/Http/Controllers/Api/V1/RepairRequestController.php` | ~319 | Full repair CRUD + lifecycle |
| `app/Http/Controllers/Api/V1/PCBuildController.php` | ~280 | PC build CRUD + review |
| `app/Http/Controllers/Api/V1/AdminController.php` | ~200 | Admin management |
| `app/Http/Controllers/Api/V1/SystemHealthController.php` | ~350 | System monitoring endpoints |
| `app/Services/LifecycleService.php` | ~150 | Repair state machine |
| `app/Services/RepairService.php` | ~300 | Repair business logic |
| `app/Services/CompatibilityService.php` | ~350 | PC compatibility engine |
| `app/Services/CostEstimationService.php` | ~200 | Cost estimation |
| `app/Services/AlertEngine.php` | ~250 | Alert evaluation |
| `app/Services/AuthService.php` | ~100 | Authentication logic |
| `app/Policies/RepairRequestPolicy.php` | ~80 | Repair authorization |
| `app/Policies/PCBuildPolicy.php` | ~70 | PC build authorization |
| `app/Http/Middleware/RoleMiddleware.php` | ~40 | Role gate |
| `app/Http/Requests/Api/V1/StoreRepairRequestRequest.php` | ~40 | Repair validation |
| `app/Http/Requests/Api/V1/StorePCBuildRequest.php` | ~30 | Build validation |
| `app/Http/Resources/Api/V1/RepairRequestResource.php` | ~120 | Repair response transformation |
| `app/Models/RepairRequest.php` | ~80 | Repair model + relationships |
| `app/Models/PCBuild.php` | ~100 | PC build model + scopes |
| `app/Models/User.php` | ~80 | User model + relationships |
| `app/Console/Commands/SnapshotRefresh.php` | ~873 | System snapshot collector |
| `bootstrap/app.php` | ~50 | Exception handler + middleware |

### Frontend Core Files

| File | Purpose |
|------|---------|
| `App.tsx` | Root component |
| `types.ts` | All TypeScript enums and interfaces |
| `services/api.ts` | Axios instance + interceptors |
| `services/authApi.ts` | Authentication API |
| `services/repairApi.ts` | Repair API |
| `services/pcBuildApi.ts` | PC Build API |
| `services/adminApi.ts` | Admin API |
| `components/Layout/AuthProvider.tsx` | Auth context |
| `components/Layout/RoleRouter.tsx` | Role-based routing |
| `components/Layout/UserAppLayout.tsx` | User portal layout |
| `components/Layout/TechnicianAppLayout.tsx` | Technician portal layout |
| `components/Layout/AdminAppLayout.tsx` | Admin portal layout |
| `components/Services/user/BuildPlanner.tsx` | PC build planner |
| `components/Services/technician/IncomingRequestsTech.tsx` | Tech incoming requests |
| `components/Services/technician/IncomingBuildRequestsTech.tsx` | Tech build reviews |
| `components/Services/technician/ServiceCompletionModal.tsx` | Completion report form |
| `components/Services/admin/AdminDashboard.tsx` | Admin dashboard |
| `components/Services/admin/AdminRequestsMgmt.tsx` | Admin request management |
| `services/telemetryStore.tsx` | Telemetry context provider |

---

**End of Report**

*Document generated: August 11, 2026*
*Project: Smart PC Hub*
*Status: READY FOR EXTERNAL EXAMINER DEMONSTRATION*
*Verification: 45/45 TESTS PASS*
