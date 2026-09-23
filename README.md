# AI-PC-MANAGEMENT-AND-REPAIR-SYSTEM
<div align="center">

# 🤖 Smart PC Hub: Enterprise Autonomous Telemetry & PC Service Management Platform

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 11">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/Architecture-Event_Driven_Telemetry-orange?style=for-the-badge" alt="Architecture">
</p>

<p align="center">
  <b>An enterprise-grade, real-time autonomous telemetry monitoring, automated diagnostics, and repair service orchestration platform. Designed to showcase advanced full-stack systems engineering, adaptive rate-limiting, event-driven streaming, and non-blocking progressive UI architecture.</b>
</p>

</div>

---

## 🎯 Candidate Portfolio & Interview Showcase

This project is meticulously architected to demonstrate senior-level engineering competencies in **AI & Systems Automation Interviews**, focusing on:
- **Real-Time Telemetry Pipelines:** Adaptive polling and WebSocket streaming with automatic heartbeat detection and failover mechanisms.
- **Adaptive Throttling & Resource Management:** Intelligent client-side throttle logic responding to user idleness (visibility change and mouse/keyboard activity) to prevent single-threaded server congestion.
- **Zero-Blocking Progressive Loading:** Stale-while-revalidate caching and optimistic UI rendering that completely eliminates loading spinners and race conditions.
- **Decoupled Monorepo Architecture:** High-throughput Laravel 11 REST API paired with a type-safe React 19 / TypeScript SPA.

---

## 📖 Table of Contents

- [🎯 Candidate Portfolio & Interview Showcase](#-candidate-portfolio--interview-showcase)
- [🏗️ High-Level System Architecture](#️-high-level-system-architecture)
- [📡 Core Automation & Telemetry Subsystems](#-core-automation--telemetry-subsystems)
- [⚡ Progressive Loading & Caching Engine](#-progressive-loading--caching-engine)
- [👥 Role-Based Access Control & Portals](#-role-based-access-control--portals)
- [📂 Monorepo Project Structure](#-monorepo-project-structure)
- [⚙️ Local Development & Quick Start](#️-getting-started--quick-start)
- [🔑 Seeded Test Credentials](#-seed-credentials)
- [🔌 REST & Stream API Reference](#-rest--stream-api-reference)
- [💡 Interview Discussion Points & Trade-offs](#-interview-discussion-points--trade-offs)

---

## 🏗️ High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              Frontend (SPA)                            │
│           React 19 | TypeScript | Vite | Tailwind CSS                  │
│                                                                        │
│  ┌───────────────────────┐   ┌──────────────────────────────────────┐  │
│  │ useCachedQuery Hook   │   │ TelemetryStreamManager               │  │
│  │ (Stale-While-Revalid) │   │ (Adaptive Polling / WS Failover)     │  │
│  └───────────┬───────────┘   └──────────────────┬───────────────────┘  │
└──────────────┼──────────────────────────────────┼──────────────────────┘
               │                                  │
               └─────────────────┬────────────────┘
                                 ▼ REST / WebSocket
┌────────────────────────────────────────────────────────────────────────┐
│                           Backend (API)                                │
│               Laravel 11 REST API (PHP 8.3) + SQLite                   │
│                                                                        │
│  ┌───────────────────────┐   ┌──────────────────────────────────────┐  │
│  │ System Controllers    │   │ Sanctum Token Authentication         │  │
│  │ (Health/Perf/Drives)  │   │ & Role-Based Middleware              │  │
│  └───────────────────────┘   └──────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📡 Core Automation & Telemetry Subsystems

### 1. Adaptive Telemetry Streaming (`TelemetryStreamManager`)
Designed to handle high-frequency system monitoring without starving server resources:
- **Dual Transport Layer:** Automatically attempts WebSocket streaming (`ws://localhost:5000/api/v1/stream`). If connection fails or drops, instantly falls back to active HTTP polling.
- **Activity-Aware Throttling:** Detects user engagement (mouse movement, keystrokes, visibility state). 
  - *Active State:* 4-second sampling interval for responsive telemetry updates.
  - *Idle State (30s inactivity):* Throttles polling down to 10-second intervals to conserve CPU and bandwidth.
- **Sliding-Window Aggregation:** `telemetryAggregator` processes incoming telemetry samples to compute rolling averages and anomaly trends.

### 2. Automated Workflow Audits & Scripts
- Includes automated audit scripts (`audit_workflow.cjs`) that test backend health endpoints and frontend responsiveness headlessly.
- Windows batch scripts (`bat/START_SYSTEM.bat`, `bat/RESET_DATABASE.bat`) automate environment orchestration for testing.

---

## ⚡ Progressive Loading & Caching Engine

Traditional React dashboards suffer from layout shifts and blocking spinners during API fetching. Smart PC Hub solves this via a robust caching hook (`useCachedQuery`):

```typescript
interface UseCachedQueryOptions<T> {
  staleTimeMs: number;        // Cache duration threshold
  fetchFn: () => Promise<T>;  // Asynchronous API fetcher
  defaultValue: T;            // Initial render fallback (guaranteed non-null)
  polling?: boolean;          // Auto-refetch toggle
}
```

- **Zero Null Checks:** Components render instantly with default or cached values.
- **Background Synchronization:** Fresh data replaces placeholders asynchronously.
- **Freshness Indicators:** Real-time `LastUpdated` component displays relative timestamps (*"3s ago"*).

---

## 👥 Role-Based Access Control & Portals

1. **👑 Administrator Portal:** System-wide metrics, multi-tenant user and technician management, global audit logging, and service oversight.
2. **🔧 Technician Portal:** Incoming repair queue triage, step-by-step diagnostic logging, custom PC build task management, and client communication.
3. **👤 Customer / User Portal:** Interactive repair request submission wizard, real-time ticket tracking, service history logs, and self-service diagnostics.

---

## 📂 Monorepo Project Structure

```text
APP/
├── backend-laravel/              # Laravel 11 PHP 8.3 REST API
│   ├── app/Http/Controllers/V1/  # System, Reports, Repairs, & Auth Controllers
│   ├── database/                 # SQLite database & seeders
│   └── routes/                   # API route definitions
├── frontend/                     # React 19 SPA (Vite + TypeScript)
│   ├── components/Services/      # Domain-specific modules (Health, Performance, Network, Storage)
│   ├── hooks/                    # useCachedQuery & state management hooks
│   ├── services/                 # TelemetryStreamManager, systemProbe, & Axios API clients
│   └── shared/                   # Telemetry contracts & type definitions
├── bat/                          # Enterprise automation script suite (.bat)
└── PLAN/                         # Comprehensive architecture & migration roadmaps
```

---

## ⚙️ Getting Started & Quick Start

### Prerequisites
- PHP `8.3+` with PDO SQLite
- Node.js `18+` & npm
- Composer

### 1. Backend Initialization (Laravel 11)
```bash
cd backend-laravel
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8000
```

### 2. Frontend Initialization (React 19)
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Access the frontend at `http://localhost:3000`.*

---

## 🔑 Seeded Test Credentials

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Admin** | `admin@smartpchub.test` | `password` | Full Administrative & System Oversight |
| **Technician** | `ali.hassan@smartpchub.test` | `password` | Ticket Triage, Diagnostics & Repair Execution |
| **Customer** | `customer1@smartpchub.test` | `password` | Repair Ticketing, Status Tracking & History |

---

## 🔌 REST & Stream API Reference

### System Diagnostics (`/api/v1/system`)
- `GET /health` — CPU, RAM, disk utilization & server uptime
- `GET /performance` — Real-time performance score and top processes
- `GET /network` — Network adapters, latency ping, and DNS status
- `GET /drives` — Storage capacity, partition health, and file stats
- `GET /hardware` — Complete hardware enumeration (CPU, GPU, RAM, BIOS)

### Authentication (`/api/v1`)
- `POST /login` — Authenticate and issue Sanctum token
- `POST /logout` — Revoke active token session
- `GET /user` — Retrieve authenticated user profile

---
## 📬 Contact & Hire Me

I am actively seeking full-time roles in **Full-Stack Software Engineering, AI Engineering, Backend Systems, and Cloud Architecture**.

- **Name:** Abdul Hannan
- **Email:** [iamhannanshahid@gmail.com](mailto:iamhannanshahid@gmail.com)
- **GitHub:** [github.com/Hannan864](https://github.com/Hannan864)
- **LinkedIn:** [linkedin.com/in/your-profile](https://linkedin.com/in/your-profile)

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Engineered with architectural discipline, high-throughput reliability, and autonomous intelligence.**

© 2026 AIITS Project • International Islamic University Islamabad

</div>
