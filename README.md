````markdown
# AI-PC-MANAGEMENT-AND-REPAIR-SYSTEM

<div align="center">

# 🤖 Smart PC Hub: AI-Powered PC Management & Repair Platform

### Autonomous Telemetry, Intelligent Diagnostics & PC Service Management System

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 11">
  <img src="https://img.shields.io/badge/PHP-8.3-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP 8.3">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/Laravel_Sanctum-Authentication-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel Sanctum">
  <img src="https://img.shields.io/badge/AI--Integrated-Applications-8A2BE2?style=for-the-badge" alt="AI-Integrated Applications">
</p>

<p align="center">
  <b>An AI-oriented full-stack PC management and repair platform combining system telemetry, automated diagnostics, intelligent application workflows, role-based service management, and a modern React + Laravel architecture.</b>
</p>

</div>

---

## 📋 Executive Summary

**Smart PC Hub** is a full-stack **AI-oriented PC management and repair platform** designed to combine system monitoring, diagnostics, repair-service management, and role-based application workflows in a single system.

The project demonstrates how a modern **React + TypeScript frontend** can communicate with a structured **Laravel REST API**, while the architecture provides a foundation for intelligent diagnostics and AI-assisted PC service workflows.

The system focuses on practical software-engineering concepts including:

- 🧠 AI-oriented diagnostics and intelligent application workflows
- 🖥️ PC system telemetry and hardware diagnostics
- 📡 Adaptive telemetry and periodic data collection
- ⚡ Progressive data loading and client-side caching
- 🔐 Authentication and role-based access control
- 🛠️ PC repair-request and service management
- 👥 Separate Admin, Technician, and Customer workflows
- 🧩 Modular frontend/backend architecture

---

## 🧭 Navigation

- [📋 Executive Summary](#-executive-summary)
- [⚡ Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🔄 Data Flow](#-data-flow)
- [🔬 Technical Deep Dive](#-technical-deep-dive)
- [🎯 Domain Coverage](#-domain-coverage)
- [🛠️ Technology Stack](#️-technology-stack)
- [📂 Project Structure](#-project-structure)
- [⚙️ Installation](#️-installation)
- [🔑 Test Credentials](#-test-credentials)
- [🔌 API Reference](#-api-reference)
- [🧠 QNA (About This Project)](#-qna-about-this-project)
- [📬 Contact & Hire Me](#-contact--hire-me)

---

# ⚡ Key Features

### 🧠 AI-Oriented PC Diagnostics
- Architecture designed around intelligent PC diagnostics and automated troubleshooting workflows
- Structured system information provides diagnostic input for intelligent application features
- Modular backend makes it possible to connect AI-assisted analysis with system and repair data
- Designed to support AI-integrated PC service workflows

### 🖥️ System Telemetry & Diagnostics
- CPU, RAM, storage, network, and hardware monitoring endpoints
- System health and performance information
- Structured telemetry data returned through REST APIs
- React dashboard for displaying system information

### 📡 Adaptive Telemetry
- `TelemetryStreamManager` manages telemetry updates
- Supports streaming where available
- HTTP polling provides an alternative data-delivery mechanism
- Polling frequency can adapt according to user activity
- Telemetry samples can be aggregated for dashboard visualization

### ⚡ Progressive Data Loading
- Custom `useCachedQuery` React hook
- Cached/default data can be displayed before fresh API responses arrive
- Background synchronization keeps displayed information updated
- Configurable stale-time behaviour
- Last-updated information can be displayed

### 🔐 Authentication & RBAC
- Laravel Sanctum authentication
- Protected API resources
- Role-based access control
- Separate application areas for Admin, Technician, and Customer users

### 🛠️ Repair Service Management
- Customer repair-request workflow
- Technician repair queue
- Diagnostic and repair-status tracking
- Service history
- Administrative oversight

### 👥 Role-Based Portals

| Role | Main Responsibilities |
|---|---|
| 👑 **Admin** | User management, system oversight, repair/service management |
| 🔧 **Technician** | Repair requests, diagnostics, repair updates and service workflow |
| 👤 **Customer** | Submit repair requests, monitor status and view service history |

---

# 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🤖 SMART PC HUB                                  │
│                    AI-Powered PC Management Platform                       │
└─────────────────────────────────────────────────────────────────────────────┘

                              FRONTEND
┌─────────────────────────────────────────────────────────────────────────────┐
│                         React 19 + TypeScript                              │
│                           Vite + Tailwind CSS                              │
│                                                                             │
│  ┌──────────────────────┐   ┌───────────────────────────────────────────┐  │
│  │ React Components     │   │ TelemetryStreamManager                    │  │
│  │                      │   │                                            │  │
│  │ • Dashboard          │   │ • Streaming                               │  │
│  │ • Diagnostics        │   │ • HTTP Polling                             │  │
│  │ • Repairs            │   │ • Activity Detection                       │  │
│  │ • User Portals       │   │ • Telemetry Aggregation                    │  │
│  └──────────┬───────────┘   └────────────────────┬──────────────────────┘  │
│             │                                    │                         │
│             └────────────────┬───────────────────┘                         │
│                              │                                             │
│                       REST / Streaming                                     │
└──────────────────────────────┼──────────────────────────────────────────────┘
                               │
                               ▼
                              API
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Laravel 11 Backend                                  │
│                              PHP 8.3                                       │
│                                                                             │
│  ┌──────────────────────┐   ┌───────────────────────────────────────────┐  │
│  │ API Controllers      │   │ Authentication & Authorization             │  │
│  │                      │   │                                             │  │
│  │ • System             │   │ • Laravel Sanctum                           │  │
│  │ • Repairs            │   │ • Role Middleware                           │  │
│  │ • Reports            │   │ • Protected Routes                          │  │
│  │ • Authentication     │   │ • User Permissions                          │  │
│  └──────────┬───────────┘   └────────────────────┬──────────────────────┘  │
│             │                                    │                         │
│             └────────────────┬───────────────────┘                         │
│                              │                                             │
│                              ▼                                             │
│                         SQLite Database                                    │
└─────────────────────────────────────────────────────────────────────────────┘
````

---

# 🔄 Data Flow

## 1. System Monitoring

```text
System / Server Data
        │
        ▼
Laravel System API
        │
        ▼
React API Client
        │
        ▼
TelemetryStreamManager
        │
        ▼
Dashboard Components
        │
        ▼
CPU / RAM / Storage / Network / Hardware
```

## 2. Intelligent Diagnostics Flow

```text
System Information
        │
        ▼
Telemetry / Diagnostic Data
        │
        ▼
Application Logic
        │
        ▼
AI-Integrated Diagnostic Layer
        │
        ▼
Diagnostic Insight / Recommended Action
```

## 3. Adaptive Telemetry

```text
User Activity
     │
     ├── Active ──────► More Frequent Updates
     │
     └── Idle ────────► Reduced Polling Frequency
                              │
                              ▼
                     Lower Unnecessary Requests
```

## 4. Repair Workflow

```text
Customer
   │
   ▼
Submit Repair Request
   │
   ▼
Admin / Service Management
   │
   ▼
Technician Assignment
   │
   ▼
Diagnosis & Repair
   │
   ▼
Status Updates
   │
   ▼
Customer Service History
```

---

# 🔬 Technical Deep Dive

## 🧠 1. AI-Oriented Diagnostics Architecture

Smart PC Hub is designed around the idea of combining **system-level information with intelligent application workflows**.

The application can organize diagnostic information such as:

* CPU state
* Memory usage
* Storage information
* Network information
* Hardware details
* System health
* Performance information

This structured information provides a foundation for AI-assisted diagnostic workflows where system data can be interpreted and converted into understandable troubleshooting guidance.

The AI-oriented architecture is kept separate from the core API and UI layers so intelligent functionality can evolve without tightly coupling the entire application to a single AI implementation.

---

## 🖥️ 2. System Telemetry & Diagnostics

The backend exposes structured system-information endpoints that allow the React dashboard to request information about the monitored environment.

The system separates diagnostic responsibilities into dedicated API endpoints:

```text
/api/v1/system/health
/api/v1/system/performance
/api/v1/system/network
/api/v1/system/drives
/api/v1/system/hardware
```

This separation keeps the API organized around individual diagnostic domains rather than placing all system information into a single endpoint.

---

## 📡 3. Networking & Adaptive Telemetry

`TelemetryStreamManager` manages how telemetry information reaches the frontend.

The architecture supports:

* Streaming communication where available
* HTTP polling as an alternative
* Connection monitoring
* Activity-aware polling
* Telemetry aggregation
* Periodic dashboard updates

The purpose is to balance **responsiveness** with **unnecessary network activity**.

---

## ⚡ 4. Adaptive Resource Management

The application monitors user interaction such as:

* Mouse activity
* Keyboard activity
* Browser visibility
* User inactivity

When the user is actively interacting with the dashboard, telemetry can update more frequently.

When the interface remains idle, the polling interval can be reduced.

This demonstrates a practical client-side resource-management technique rather than continuously requesting data at a fixed frequency.

---

## 🚀 5. Frontend Performance & Progressive Loading

A custom React hook, `useCachedQuery`, manages cached and asynchronous API data.

```typescript
interface UseCachedQueryOptions<T> {
  staleTimeMs: number;
  fetchFn: () => Promise<T>;
  defaultValue: T;
  polling?: boolean;
}
```

The approach allows components to:

* Render an initial value immediately
* Reuse previously retrieved data
* Fetch updated data asynchronously
* Control cache freshness
* Optionally refresh data periodically

This reduces unnecessary blocking states in dashboard components.

---

## 🔐 6. Authentication & Role-Based Access Control

Authentication is implemented using **Laravel Sanctum**.

The application separates functionality according to user roles:

```text
                    ┌──────────────┐
                    │     User     │
                    └──────┬───────┘
                           │
                           ▼
                  Authentication
                           │
                           ▼
                    Role Middleware
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
          Admin       Technician      Customer
```

Protected API resources can therefore be accessed according to the authenticated user's role.

---

## 🛠️ 7. Repair Service Workflow

The repair-management side of Smart PC Hub models a practical service process.

```text
Customer Request
       │
       ▼
Service Queue
       │
       ▼
Assignment
       │
       ▼
Technician
       │
       ▼
Diagnosis
       │
       ▼
Repair Progress
       │
       ▼
Completion
       │
       ▼
Service History
```

This provides a structured workflow for connecting customers, administrators, and technicians.

---

## 🧩 8. Software Architecture

The project follows a separated frontend/backend architecture:

```text
React SPA
   │
   │ REST API
   ▼
Laravel Backend
   │
   ├── Authentication
   ├── Authorization
   ├── Business Logic
   ├── System APIs
   ├── Repair APIs
   └── AI-Integration Layer
   │
   ▼
SQLite
```

This separation keeps presentation and client-side interaction separate from server-side application logic and data management.

---

# 🎯 Domain Coverage

| Domain                                      | What It Demonstrates                                                   | Technical Proof                                       | Relevant Roles                 |
| ------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------ |
| **Backend Development**                     | REST API design and server-side application logic                      | Laravel 11, PHP 8.3, Controllers, Routes              | Backend Developer              |
| **Frontend Development**                    | Interactive SPA development                                            | React 19, TypeScript, Vite, Tailwind CSS              | Frontend Developer             |
| **AI-Integrated Applications**              | Intelligent application architecture and AI-ready diagnostic workflows | Diagnostic data pipeline, modular AI integration      | AI Application Developer       |
| **IT Systems & Infrastructure**             | System monitoring and diagnostics                                      | Health, performance, network, drive and hardware APIs | IT / Systems Developer         |
| **Software / Service Management Platforms** | Role-based service workflows                                           | Admin, Technician and Customer portals                | Full-Stack Developer           |
| **Authentication & Security**               | Protected application resources                                        | Laravel Sanctum, middleware, RBAC                     | Backend / Full-Stack Developer |
| **Performance Engineering**                 | Client-side request and rendering optimization                         | Caching, adaptive polling, progressive loading        | Software Developer             |

---

# 🛠️ Technology Stack

| Layer                | Technology                            | Purpose                                 |
| -------------------- | ------------------------------------- | --------------------------------------- |
| **Frontend**         | React 19                              | User interface and SPA architecture     |
| **Language**         | TypeScript 5.x                        | Type-safe frontend development          |
| **Build Tool**       | Vite                                  | Frontend development and build pipeline |
| **Styling**          | Tailwind CSS 3.x                      | Responsive UI styling                   |
| **Backend**          | Laravel 11                            | REST API and application backend        |
| **Backend Language** | PHP 8.3                               | Server-side application development     |
| **Authentication**   | Laravel Sanctum                       | API authentication                      |
| **Database**         | SQLite                                | Local application data storage          |
| **API**              | REST                                  | Frontend/backend communication          |
| **Telemetry**        | Streaming / HTTP Polling              | System data delivery                    |
| **AI Layer**         | AI-Integrated Diagnostic Architecture | Intelligent diagnostic workflows        |
| **Automation**       | Windows Batch                         | Local development utilities             |

---

# 📂 Project Structure

```text
APP/
│
├── backend-laravel/
│   ├── app/
│   │   └── Http/
│   │       └── Controllers/
│   │           └── V1/
│   │               ├── System/
│   │               ├── Reports/
│   │               ├── Repairs/
│   │               └── Auth/
│   │
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   │
│   └── routes/
│       └── api.php
│
├── frontend/
│   ├── components/
│   │   └── Services/
│   │
│   ├── hooks/
│   │   └── useCachedQuery
│   │
│   ├── services/
│   │   ├── TelemetryStreamManager
│   │   ├── systemProbe
│   │   └── API clients
│   │
│   └── shared/
│       └── Types & contracts
│
├── bat/
│   ├── START_SYSTEM.bat
│   └── RESET_DATABASE.bat
│
└── PLAN/
    └── Architecture & migration documentation
```

---

# ⚙️ Installation

## Prerequisites

Make sure the following are installed:

* PHP `8.3+`
* Composer
* Node.js `18+`
* npm
* PHP PDO SQLite extension

---

## 1. Clone the Repository

```bash
git clone https://github.com/Hannan864/AI-PC-MANAGEMENT-AND-REPAIR-SYSTEM.git
cd AI-PC-MANAGEMENT-AND-REPAIR-SYSTEM
```

---

## 2. Configure the Laravel Backend

```bash
cd backend-laravel

composer install

cp .env.example .env

php artisan key:generate

php artisan migrate --seed

php artisan serve --port=8000
```

---

## 3. Start the React Frontend

Open another terminal:

```bash
cd frontend

npm install

npm run dev
```

The frontend will normally be available at:

```text
http://localhost:3000
```

The Laravel API will normally run at:

```text
http://localhost:8000
```

---

# 🔑 Test Credentials

| Role              | Email                        | Password   |
| ----------------- | ---------------------------- | ---------- |
| 👑 **Admin**      | `admin@smartpchub.test`      | `password` |
| 🔧 **Technician** | `ali.hassan@smartpchub.test` | `password` |
| 👤 **Customer**   | `customer1@smartpchub.test`  | `password` |

> These credentials are intended for local development and demonstration purposes only.

---

# 🔌 API Reference

## System Diagnostics

| Method | Endpoint                     | Purpose                                      |
| ------ | ---------------------------- | -------------------------------------------- |
| `GET`  | `/api/v1/system/health`      | CPU, RAM, disk utilization and system health |
| `GET`  | `/api/v1/system/performance` | Performance information and top processes    |
| `GET`  | `/api/v1/system/network`     | Network adapter and connectivity information |
| `GET`  | `/api/v1/system/drives`      | Storage and drive information                |
| `GET`  | `/api/v1/system/hardware`    | Hardware information                         |

## Authentication

| Method | Endpoint         | Purpose                                 |
| ------ | ---------------- | --------------------------------------- |
| `POST` | `/api/v1/login`  | Authenticate a user                     |
| `POST` | `/api/v1/logout` | End the authenticated session           |
| `GET`  | `/api/v1/user`   | Retrieve authenticated user information |

---

# 🧠 QNA (About This Project)

### 1. Why did I build `useCachedQuery`?

I built `useCachedQuery` to improve the dashboard's data-loading experience. It allows components to use cached or default data immediately while fresh API data is retrieved in the background.

This helps reduce unnecessary blocking states and keeps the interface responsive during repeated data requests.

### 2. How does the telemetry system work?

I built `TelemetryStreamManager` to manage telemetry updates between the frontend and backend. It can use streaming communication where available and fall back to HTTP polling when necessary.

The polling behaviour can also respond to user activity so the application does not continuously request telemetry at the same rate while the interface is idle.

### 3. Why did I use adaptive polling?

I used adaptive polling to reduce unnecessary requests when the user is not actively interacting with the dashboard.

When the interface is active, telemetry can be refreshed more frequently. During inactivity, the refresh interval can be reduced.

### 4. Why did I use Laravel for the backend?

I used Laravel 11 because it provides a structured framework for building the REST API, authentication, middleware, database operations, validation, and role-based access control.

It also allows the backend to remain clearly separated from the React frontend.

### 5. Why did I use React and TypeScript?

I used React for the interactive single-page application and TypeScript to provide stronger type safety across components, API responses, telemetry data, and shared application contracts.

### 6. How is authentication implemented?

I implemented authentication using Laravel Sanctum.

Authenticated users receive access to protected API resources, while middleware and role-based authorization control access to different application areas.

### 7. How does the AI-oriented diagnostic architecture work?

The system organizes PC health, hardware, performance, and diagnostic information into structured application data.

That structure can be used by an AI-integrated diagnostic layer to interpret system conditions and provide understandable troubleshooting guidance without tightly coupling the core application to one specific AI implementation.

### 8. How does the repair workflow work?

The repair workflow allows a customer to submit a service request, after which the request can be managed through the administrative workflow and handled by a technician.

The technician can work through the repair process and update the service status, while the customer can track the request and service history.

### 9. How did I separate the frontend and backend?

I separated the application into two major parts:

```text
React + TypeScript
        │
        │ REST API
        ▼
Laravel + PHP
        │
        ▼
SQLite
```

This keeps presentation and client-side interaction separate from server-side application logic and data management.

### 10. What software-engineering concepts does this project demonstrate?

The project demonstrates:

* REST API development
* SPA architecture
* Type-safe frontend development
* Authentication
* Role-based authorization
* Client-side caching
* Adaptive polling
* System diagnostics
* AI-integrated application architecture
* Modular application architecture
* Service-management workflows

### 11. What would I improve for a production deployment?

For a larger deployment, I would consider a production database and hosting environment, automated testing, CI/CD, centralized logging and monitoring, stronger production security configuration, and dedicated real-time infrastructure where continuous telemetry requires it.

---

# 🧪 Development & Engineering Utilities

The project includes local development utilities for simplifying testing and environment management.

### Included Utilities

* Backend health checks
* Frontend responsiveness checks
* Database reset scripts
* Windows batch startup automation
* Architecture and migration documentation
* API endpoint testing

---

# 🚀 Possible Future Extensions

The current architecture can be extended with features such as:

* PostgreSQL or MySQL for larger deployments
* Automated test suites
* CI/CD pipelines
* Production monitoring and logging
* Dedicated WebSocket infrastructure
* Advanced hardware diagnostics
* AI-assisted troubleshooting recommendations
* AI-generated diagnostic reports
* Notification systems
* Detailed service reporting
* Cloud deployment

These are potential extensions rather than claims about functionality currently implemented in the project.

---

# 📬 Contact & Hire Me

<div align="center">

## Abdul Hannan

### BSIT Graduate • Full-Stack Developer • AI-Integrated Applications

📧 **[iamhannanshahid@gmail.com](mailto:iamhannanshahid@gmail.com)**

💻 **[GitHub](https://github.com/Hannan864)**

🔗 **[LinkedIn](https://linkedin.com/in/your-profile)**

</div>

### Technical Areas

**Backend Development**
Laravel • PHP • REST APIs • Authentication • RBAC

**Frontend Development**
React • TypeScript • Vite • Tailwind CSS

**AI-Integrated Applications**
AI-enabled application architecture • API integration • Intelligent diagnostic workflows

**IT Systems & Infrastructure**
System diagnostics • Telemetry • Hardware information • Network monitoring

**Software / Service Management Platforms**
Repair workflows • Role-based portals • Service tracking • Administrative systems

---

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Smart PC Hub — AI-Powered PC Management, Diagnostics & Repair Platform**

© 2026 Abdul Hannan

</div>
```
