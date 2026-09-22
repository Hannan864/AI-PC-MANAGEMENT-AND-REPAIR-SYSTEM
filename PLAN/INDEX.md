# Smart PC Hub -- Plan Library

All project planning, architecture, reports, and examiner documentation in one place.

**Examiner?** Start with `01-examiner/SMART_PC_HUB_FINAL_EXAMINER_REPORT.md`.

---

## Folders

```
PLAN/
  01-examiner/       Start here -- official verification report
  02-architecture/   System design, blueprints, data flow
  03-reports/        Audit reports, bug fixes, changelog
  04-migration/      Python to Laravel migration docs
  05-status/         Current status, schema, task tracking
```

---

## 01-examiner/

Official documents for the external FYP examiner.

| File | What it is |
|---|---|
| SMART_PC_HUB_FINAL_EXAMINER_REPORT.md | Master report -- architecture, DB, API, frontend, verification (20 sections) |
| 01-fyp-final-report.md | FYP final report narrative |
| 02-compliance-checklist.md | Compliance against FYP requirements |
| 03-completion-matrix.md | Feature completion matrix |
| 04-deployment-steps.md | How to export and deploy |

---

## 02-architecture/

How the system is designed and structured.

| File | What it is |
|---|---|
| 01-system-blueprint.md | Original system blueprint |
| 02-blueprint-overview.md | Blueprint summary |
| 03-data-flow.md | Data flow: frontend -> API -> database |
| 04-directory-structure.md | Project directory layout |
| 05-architecture-audit.md | Architecture audit results |
| 06-frontend-api-connection.md | How frontend connects to backend |
| 07-api-endpoint-mapping.md | API endpoints mapped to frontend components |
| 08-ai-dev-instructions.md | AI-assisted development instructions |

---

## 03-reports/

Technical reports, audits, and changelog.

| File | What it is |
|---|---|
| 01-backend-audit.md | Backend reference audit (Python vs Laravel) |
| 02-backend-readiness.md | Backend readiness assessment |
| 03-integration-status.md | Frontend-backend integration status |
| 04-pcbuild-gap-analysis.md | PC Build module gaps |
| 05-missing-features.md | Features identified as missing |
| 06-remaining-mocks.md | Mock systems still in place |
| 07-mock-to-real.md | Mock-to-real migration mapping |
| 08-crash-fixes.md | Runtime crash fixes |
| 09-runtime-verification.md | Runtime verification results |
| 10-stabilization.md | Phase 1 stabilization report |
| 11-changelog.md | Full changelog |

---

## 04-migration/

Python FastAPI + IndexedDB -> Laravel 11 + SQLite migration.

| File | What it is |
|---|---|
| 01-python-plan.md | Original Python backend plan |
| 02-laravel-integration.md | Laravel migration integration plan |
| 03-python-deprecated.md | Deprecated Python backend notice |

---

## 05-status/

Current project state and planning.

| File | What it is |
|---|---|
| 01-project-context.md | Master context -- overview, status, decisions |
| 02-database-schema.md | Database schema documentation |
| 03-backend-status.md | Backend current status |
| 04-deployment-readiness.md | Deployment readiness assessment |
| 05-phase-tasks.md | Phase-by-phase task tracking |
| 06-future-features.md | Planned but not implemented |
| 07-next-session-handoff.md | Instructions for next AI session |

---

## Quick Lookup

| Question | Go to |
|---|---|
| What is this project? | 05-status/01-project-context.md |
| Show me the verification results | 01-examiner/SMART... (Section 17) |
| What are the API endpoints? | 01-examiner/SMART... (Section 10) |
| What is the database schema? | 05-status/02-database-schema.md |
| How does auth work? | 01-examiner/SMART... (Section 9) |
| What was migrated from Python? | 04-migration/ |
| What bugs were fixed? | 03-reports/08-crash-fixes.md |
| What is the frontend structure? | 02-architecture/04-directory-structure.md |
| What features are missing? | 03-reports/05-missing-features.md |
| What is left to do? | 05-status/06-future-features.md |
