# Smart PC Hub — Laravel Backend Setup Guide

## Prerequisites

Before running the backend, ensure the following are installed:

| Tool | Version | Download |
|------|---------|----------|
| PHP | 8.2+ | https://windows.php.net/download/ |
| Composer | Latest | https://getcomposer.org/Composer-Setup.exe |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/installer/ |

> **Recommended**: Use [Laragon](https://laragon.org/) or [XAMPP](https://www.apachefriends.org/) for an easy all-in-one local environment.

---

## Quick Start

### 1. Install Dependencies
```bash
cd backend-laravel
composer install
```

### 2. Configure Environment
```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` and set your MySQL credentials:
```env
DB_DATABASE=smartpchub
DB_USERNAME=root
DB_PASSWORD=your_password
```

### 3. Create the MySQL Database
```sql
CREATE DATABASE smartpchub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run Migrations & Seed
```bash
php artisan migrate:fresh --seed
```

This will:
- Create all 6 tables (users, technician_profiles, repair_requests, lifecycle_events, completion_reports, pc_builds)
- Seed test accounts and demo repair requests

### 5. Create Storage Symlink
```bash
php artisan storage:link
```

### 6. Start the Development Server
```bash
php artisan serve
```

API will be available at: `http://localhost:8000/api/`

---

## Seeded Test Accounts

All seeded accounts use the password: **`password`**

| Role | Email | Notes |
|------|-------|-------|
| Admin | admin@smartpchub.test | Full system access |
| Technician | ali.hassan@smartpchub.test | Hardware Repair specialist |
| Technician | sara.malik@smartpchub.test | Software specialist |
| Technician | usman.khan@smartpchub.test | Networking specialist |
| Customer | customer1@smartpchub.test | Has unassigned request |
| Customer | customer2@smartpchub.test | Has assigned request |
| Customer | customer3@smartpchub.test | Has in-progress request |
| Customer | customer4@smartpchub.test | Has completed request |
| Customer | customer5@smartpchub.test | Has cancelled request |

---

## API Endpoints (v1)

Base URL: `http://localhost:8000/api/v1`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new account |
| POST | `/auth/login` | Login → returns Bearer token |
| POST | `/auth/logout` | Revoke token (auth required) |
| GET | `/auth/me` | Get authenticated user (auth required) |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health ping |

---

## AI Configuration

The AI triage layer is **disabled by default**. To enable:

```env
AI_ENABLED=true
AI_DRIVER=gemini
GEMINI_API_KEY=your_google_gemini_api_key
```

To use only local rule-based analysis (no external API):
```env
AI_ENABLED=false
```

---

## Directory Structure

```
backend-laravel/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/   # API controllers (Phase 3+)
│   │   ├── Middleware/           # RoleMiddleware
│   │   ├── Requests/             # Form validation (Phase 3+)
│   │   └── Resources/            # API resources (Phase 3+)
│   ├── Models/                   # Eloquent models (Phase 2 ✓)
│   ├── Providers/                # AppServiceProvider with AI binding
│   └── Services/
│       └── AI/                   # Modular AI triage services
├── config/
│   └── ai.php                    # AI configuration
├── database/
│   ├── factories/                # Model factories (Phase 2 ✓)
│   ├── migrations/               # DB migrations (Phase 2 ✓)
│   └── seeders/                  # Test data seeders (Phase 2 ✓)
└── routes/
    └── api.php                   # All API route definitions
```
