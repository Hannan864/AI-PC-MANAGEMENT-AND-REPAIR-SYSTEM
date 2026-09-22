# Backend Reference Audit Report
## Comprehensive Search for Old Python/FastAPI Backend References

---

## 1. FastAPI References

### EXPECTED (Documentation/Planning Files)
| File | Line | Match | Classification |
|------|------|-------|----------------|
| `phases+task.md` | 15 | `replacing the deprecated stateless Python FastAPI backend` | EXPECTED - Migration planning doc |
| `phases+task.md` | 43 | `Python FastAPI. | Move to /backend-python-deprecated` | EXPECTED - Migration planning doc |
| `phases+task.md` | 291 | `├── /backend-python-deprecated # Archived legacy FastAPI backend` | EXPECTED - Project structure doc |
| `backend-python-deprecated/DEPRECATED.md` | 3 | `legacy FastAPI backend code for reference` | EXPECTED - Deprecation notice |
| `backend-python-deprecated/DEPRECATED.md` | 6 | `Stateless FastAPI server` | EXPECTED - Deprecation notice |
| `backend-python-deprecated/requirements.txt` | 1 | `fastapi==0.110.0` | EXPECTED - Archived dependency |
| `backend-python-deprecated/main.py` | 12 | `from fastapi import FastAPI, WebSocket` | EXPECTED - Archived code |
| `backend-python-deprecated/main.py` | 13 | `from fastapi.middleware.cors import CORSMiddleware` | EXPECTED - Archived code |
| `backend-python-deprecated/main.py` | 31 | `# Initialize FastAPI app` | EXPECTED - Archived code |
| `backend-python-deprecated/main.py` | 32 | `app = FastAPI(` | EXPECTED - Archived code |
| `backend-python-deprecated/main.py` | 495 | `from fastapi import APIRouter` | EXPECTED - Archived code |
| `PLAN/blueprint.md` | 4 | `Python FastAPI telemetry stream connection` | EXPECTED - Planning doc |
| `PLAN/blueprint.md` | 86-88 | `## 6. Planned Python FastAPI Stream Integration` | EXPECTED - Planning doc |
| `PLAN/backend_readiness_report.md` | 4 | `System Sentinel Python FastAPI Developer Bot` | EXPECTED - Planning doc |
| `PLAN/backend_readiness_report.md` | 27 | `FastAPI (Python 3.11)` | EXPECTED - Planning doc |
| `PLAN/backend_python_plan.md` | 1-49 | Multiple FastAPI references | EXPECTED - Planning doc |
| `PLAN/backend_integration_plan.md` | 4-102 | Multiple FastAPI references | EXPECTED - Planning doc |
| `PLAN/ai_instructions_for_backend.md` | 3-530 | Multiple FastAPI references | EXPECTED - Planning doc |
| `PLAN/final_architecture_audit.md` | 5-53 | Multiple FastAPI references | EXPECTED - Planning doc |
| `PLAN/export_checklist.md` | 14-53 | Multiple FastAPI references | EXPECTED - Planning doc |
| `PLAN/deployment_readiness_report.md` | 20-24 | Multiple FastAPI references | EXPECTED - Planning doc |
| `PLAN/frontend_backend_connection.md` | 3 | `FastAPI (Python) backend` | EXPECTED - Planning doc |
| `PLAN/frontend_backend_mapping.md` | 3 | `FastAPI REST/WS endpoints` | EXPECTED - Planning doc |
| `PLAN/mock_to_real_mapping.md` | 69 | `FastAPI Telemetry Streamer` | EXPECTED - Planning doc |
| `PLAN/fyp_final_report.md` | 15-24 | Multiple FastAPI references | EXPECTED - Planning doc |
| `PLAN/fyp_compliance_report.md` | 25 | `FastAPI OS polling streams` | EXPECTED - Planning doc |
| `PLAN/future_features_backlog.md` | 11 | `FastAPI WebSocket broadcasting` | EXPECTED - Planning doc |
| `PLAN/pc_builder_gap_analysis.md` | 44 | `Python FastAPI side` | EXPECTED - Planning doc |
| `PLAN/next_ai_handoff.md` | 12-29 | Multiple FastAPI references | EXPECTED - Planning doc |
| `PLAN/project_completion_matrix.md` | 11-85 | Multiple FastAPI references | EXPECTED - Planning doc |
| `PLAN/project_structure.md` | 21-93 | Multiple FastAPI references | EXPECTED - Planning doc |
| `PLAN/runtime_verification_report.md` | 42 | `All API calls reaching FastAPI` | EXPECTED - Planning doc |

### BUG (Active Code Files)
| File | Line | Match | Classification |
|------|------|-------|----------------|
| `frontend/services/pcBuilder.ts` | 45 | `Connects to the FastAPI PC Builder Scoring Engine` | BUG - Should reference Laravel backend |

---

## 2. Python References

### EXPECTED (Documentation/Planning Files)
| File | Line | Match | Classification |
|------|------|-------|----------------|
| `backend-python-deprecated/DEPRECATED.md` | 1-7 | Multiple Python references | EXPECTED - Deprecation notice |
| `.vscode/settings.json` | 2 | `python.defaultInterpreterPath` | EXPECTED - VS Code config |
| `CHANGELOG.md` | 5-599 | Multiple Python references | EXPECTED - Changelog |
| `phases+task.md` | 15-599 | Multiple Python references | EXPECTED - Planning doc |
| `PLAN/*` | Multiple | Multiple Python references | EXPECTED - Planning docs |

### BUG (Active Code Files)
| File | Line | Match | Classification |
|------|------|-------|----------------|
| `frontend/shared/telemetryContract.ts` | 5 | `Backend (Python Pydantic equivalent mapping)` | BUG - Should reference Laravel |
| `frontend/shared/telemetryContract.ts` | 15 | `Python/Pydantic equivalent:` | BUG - Should reference Laravel |
| `frontend/shared/telemetryContract.ts` | 43 | `Python/Pydantic equivalent:` | BUG - Should reference Laravel |
| `frontend/shared/telemetryContract.ts` | 70 | `Python/Pydantic equivalent:` | BUG - Should reference Laravel |
| `frontend/shared/telemetryContract.ts` | 97 | `Python/Pydantic equivalent:` | BUG - Should reference Laravel |
| `frontend/shared/telemetryContract.ts` | 135 | `Python/Pydantic equivalent:` | BUG - Should reference Laravel |
| `frontend/services/telemetryQueue.ts` | 4 | `when the Python backend is slow or offline` | BUG - Should reference Laravel |
| `frontend/services/telemetryBridge.ts` | 4 | `import { PythonDiagnosticProvider } from './providers/pythonProvider'` | BUG - Dead import |
| `frontend/services/telemetryBridge.ts` | 17 | `private pythonProvider = new PythonDiagnosticProvider()` | BUG - Dead code |
| `frontend/services/telemetryBridge.ts` | 76 | `pythonCall: () => Promise<T>` | BUG - Dead parameter |
| `frontend/services/telemetryBridge.ts` | 91 | `const result = await pythonCall()` | BUG - Dead code |
| `frontend/services/telemetryBridge.ts` | 113 | `Python backend failure on ${operationName}` | BUG - Dead error message |
| `frontend/services/telemetryBridge.ts` | 133-197 | Multiple `this.pythonProvider.*` calls | BUG - Dead code |
| `frontend/services/diagnosticProvider.ts` | 6 | `import { PythonDiagnosticProvider } from './providers/pythonProvider'` | BUG - Dead import |
| `frontend/services/providers/pythonProvider.ts` | 1-173 | Entire file | BUG - Dead file, should be removed |
| `frontend/services/telemetryStreamManager.ts` | 113 | `ws://localhost:5000/api/${version}/stream` | BUG - Should reference Laravel WebSocket |
| `frontend/services/systemHealthMonitor.ts` | 90-92 | `pythonAttempts` variable | BUG - Dead variable |
| `frontend/components/Services/dashboard/AdminDashboard.tsx` | 103 | `Switch sources, manage Python API versions` | BUG - Should reference Laravel |
| `frontend/components/Services/dashboard/AdminDashboard.tsx` | 123 | `PYTHON` mode button | BUG - Dead UI element |
| `frontend/components/Services/auth/RegisterScreen.tsx` | 128-130 | `PYTHON` mode button | BUG - Dead UI element |
| `frontend/components/Services/auth/LoginScreen.tsx` | 80-82 | `PYTHON` mode button | BUG - Dead UI element |

---

## 3. Uvicorn/Pydantic/aiohttp References

### EXPECTED (Documentation/Planning Files)
| File | Line | Match | Classification |
|------|------|-------|----------------|
| `PLAN/ai_instructions_for_backend.md` | 26 | `uvicorn==0.30.1` | EXPECTED - Planning doc |
| `PLAN/ai_instructions_for_backend.md` | 27 | `pydantic==2.7.4` | EXPECTED - Planning doc |
| `PLAN/ai_instructions_for_backend.md` | 80 | `from pydantic import BaseModel, Field` | EXPECTED - Planning doc |
| `PLAN/ai_instructions_for_backend.md` | 451-454 | `import uvicorn` / `uvicorn.run()` | EXPECTED - Planning doc |

### EXPECTED (Node Modules)
| File | Line | Match | Classification |
|------|------|-------|----------------|
| `frontend/node_modules/@google/genai/dist/web/web.d.ts` | 10328 | `Use pydantic models` | EXPECTED - Third-party type definition |
| `frontend/node_modules/@google/genai/dist/vertex_internal/index.d.ts` | 6701 | `Use pydantic models` | EXPECTED - Third-party type definition |
| `frontend/node_modules/@google/genai/dist/node/node.d.ts` | 10335 | `Use pydantic models` | EXPECTED - Third-party type definition |
| `frontend/node_modules/@google/genai/dist/genai.d.ts` | 10323 | `Use pydantic models` | EXPECTED - Third-party type definition |

---

## 4. WebSocket References

### EXPECTED (Documentation/Planning Files)
| File | Line | Match | Classification |
|------|------|-------|----------------|
| `PLAN/*` | Multiple | Multiple WebSocket references | EXPECTED - Planning docs |

### BUG (Active Code Files)
| File | Line | Match | Classification |
|------|------|-------|----------------|
| `frontend/services/telemetryStreamManager.ts` | 113 | `ws://localhost:5000/api/${version}/stream` | BUG - Should reference Laravel WebSocket |

---

## 5. localhost:8000 References

### EXPECTED (Laravel Backend)
| File | Line | Match | Classification |
|------|------|-------|----------------|
| `backend-laravel/README.md` | 62 | `http://localhost:8000/api/` | EXPECTED - Laravel docs |
| `backend-laravel/README.md` | 86 | `http://localhost:8000/api/v1` | EXPECTED - Laravel docs |
| `frontend/services/api.ts` | 3 | `http://localhost:8000/api` | EXPECTED - Laravel API base URL |

### EXPECTED (Node Modules)
| File | Line | Match | Classification |
|------|------|-------|----------------|
| `frontend/node_modules/@types/node/https.d.ts` | 307 | `https://localhost:8000/` | EXPECTED - Type definitions |
| `frontend/node_modules/@types/node/http2.d.ts` | 1743-1795 | Multiple `127.0.0.1:8000` | EXPECTED - Type definitions |
| `frontend/node_modules/@types/node/http.d.ts` | 1312-1941 | Multiple `127.0.0.1:8000` | EXPECTED - Type definitions |

---

## 6. localhost:5000 References (Python Backend Port)

### BUG (Active Code Files)
| File | Line | Match | Classification |
|------|------|-------|----------------|
| `frontend/services/pcBuilder.ts` | 50 | `http://localhost:5000/api/${version}/pc-builder/score` | BUG - Should reference Laravel |
| `frontend/services/telemetryStreamManager.ts` | 113 | `ws://localhost:5000/api/${version}/stream` | BUG - Should reference Laravel |
| `frontend/services/providers/pythonProvider.ts` | 63 | `http://localhost:5000/api/${version}` | BUG - Dead file |
| `frontend/services/providers/pythonProvider.ts` | 132 | `http://localhost:5000/api/${version}/optimize` | BUG - Dead file |

---

## 7. Telemetry References

### EXPECTED (Active Infrastructure)
| File | Line | Match | Classification |
|------|------|-------|----------------|
| `frontend/shared/telemetryContract.ts` | 7 | `Strict alignment to these contract schemas` | EXPECTED - Active contract |
| `frontend/services/telemetryStreamManager.ts` | All | Telemetry stream manager | EXPECTED - Active service |
| `frontend/services/telemetryQueue.ts` | All | Telemetry queue | EXPECTED - Active service |
| `frontend/services/telemetryBridge.ts` | All | Telemetry bridge | EXPECTED - Active service |
| `frontend/services/telemetryAggregator.ts` | All | Telemetry aggregator | EXPECTED - Active service |
| `frontend/services/telemetrySchemaValidator.ts` | All | Telemetry schema validator | EXPECTED - Active service |

### BUG (Python-Specific Telemetry)
| File | Line | Match | Classification |
|------|------|-------|----------------|
| `frontend/services/telemetryQueue.ts` | 4 | `when the Python backend is slow` | BUG - Should reference Laravel |
| `frontend/services/telemetryBridge.ts` | 113 | `Python backend failure` | BUG - Should reference Laravel |
| `frontend/components/Services/dashboard/AdminDashboard.tsx` | 103 | `manage Python API versions` | BUG - Should reference Laravel |

---

## 8. IndexedDB Imports and Calls

### EXPECTED (Active IndexedDB Layer)
| File | Line | Match | Classification |
|------|------|-------|----------------|
| `frontend/services/db.ts` | All | SentinelDB class | EXPECTED - Active IndexedDB layer |
| `frontend/services/dbHelpers.ts` | All | DB helper functions | EXPECTED - Active helpers |
| 24 files | Multiple | `import { db } from '../../services/db'` | EXPECTED - Active imports |
| Multiple files | Multiple | `db.getRepairRequestsByUser` | EXPECTED - Active calls |
| Multiple files | Multiple | `db.getRepairRequestsByTechnician` | EXPECTED - Active calls |
| Multiple files | Multiple | `db.getGigs` | EXPECTED - Active calls |
| Multiple files | Multiple | `db.addRepairRequest` | EXPECTED - Active calls |
| Multiple files | Multiple | `db.addUserHistory` | EXPECTED - Active calls |
| Multiple files | Multiple | `db.getUserHistory` | EXPECTED - Active calls |
| Multiple files | Multiple | `db.init` | EXPECTED - Active calls |

---

## 9. Old Backend Files in Backup

### Backup Location: `C:\Users\CORE\Desktop\0FYP\BACHUPS\APPCopy\services\db.ts`

The backup contains the same `db.ts` file (297 lines) as the current frontend, indicating:
- **IndexedDB layer is identical** between backup and current project
- **No migration has occurred** - the IndexedDB layer remains unchanged
- The backup also contains `dbHelpers.ts` (same as current)

---

## 10. Summary Statistics

| Category | EXPECTED | BUG | DEPRECATED |
|----------|----------|-----|------------|
| FastAPI | 32 | 1 | 0 |
| Python | 50+ | 22 | 0 |
| Uvicorn/Pydantic/aiohttp | 4 | 0 | 0 |
| WebSocket | 10+ | 1 | 0 |
| localhost:8000 | 6 | 0 | 0 |
| localhost:5000 | 0 | 4 | 0 |
| Telemetry | 20+ | 3 | 0 |
| IndexedDB | 31 | 0 | 0 |
| **TOTAL** | **153+** | **31** | **0** |

---

## 11. Critical Issues Requiring Immediate Action

### HIGH PRIORITY (Active Code Bugs)
1. **`frontend/services/providers/pythonProvider.ts`** - Entire file should be removed
2. **`frontend/services/telemetryBridge.ts`** - Remove PythonDiagnosticProvider imports and all pythonProvider calls
3. **`frontend/services/diagnosticProvider.ts`** - Remove PythonDiagnosticProvider import
4. **`frontend/services/pcBuilder.ts:50`** - Update URL from localhost:5000 to Laravel backend
5. **`frontend/services/telemetryStreamManager.ts:113`** - Update WebSocket URL from localhost:5000 to Laravel

### MEDIUM PRIORITY (Documentation in Active Code)
1. **`frontend/shared/telemetryContract.ts`** - Remove Python/Pydantic comments (6 occurrences)
2. **`frontend/services/telemetryQueue.ts:4`** - Update "Python backend" to "Laravel backend"
3. **`frontend/services/telemetryBridge.ts:113`** - Update error message
4. **`frontend/components/Services/dashboard/AdminDashboard.tsx:103`** - Update UI text
5. **`frontend/components/Services/auth/RegisterScreen.tsx`** - Remove PYTHON mode button
6. **`frontend/components/Services/auth/LoginScreen.tsx`** - Remove PYTHON mode button
7. **`frontend/services/systemHealthMonitor.ts:90-92`** - Remove pythonAttempts variable

### LOW PRIORITY (Planning/Documentation Files)
- All files in `PLAN/` directory - EXPECTED, keep as historical reference
- All files in `backend-python-deprecated/` - EXPECTED, keep as archived code
- All files in `CHANGELOG.md` - EXPECTED, keep as historical record

---

## 12. Recommendations

1. **Delete** `frontend/services/providers/pythonProvider.ts`
2. **Refactor** `frontend/services/telemetryBridge.ts` to remove all Python references
3. **Refactor** `frontend/services/diagnosticProvider.ts` to remove PythonDiagnosticProvider
4. **Update** all `localhost:5000` URLs to point to Laravel backend (`localhost:8000`)
5. **Remove** PYTHON mode toggle from UI components
6. **Clean up** telemetryContract.ts comments to reference Laravel instead of Python/Pydantic
7. **Keep** all planning docs in `PLAN/` as historical reference
8. **Keep** `backend-python-deprecated/` as archived code
