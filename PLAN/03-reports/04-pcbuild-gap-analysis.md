# System Sentinel Platform — APCIE PC Builder Gap Analysis

This document provides a comprehensive technical audit of the **Advanced PC Builder Intelligence Engine (APCIE)**, grading its features against requirements for high-precision DIY computer assembly configurations.

---

## 1. Feature Status Matrix

| System Module | Feature Objective | Core File & Metric | Status Rating |
| :--- | :--- | :--- | :--- |
| **Compatibility Engine** | Cross-parts physical and electrical checking | `services/pcBuilder.ts` | **COMPLETE** |
| **Socket Validation** | AM5, AM4, LGA1700 pin compatibility audit | `evaluatePCBuild()` rule (A) | **COMPLETE** |
| **RAM Validation** | DDR5 vs DDR4 memory generation guardrails | `evaluatePCBuild()` rule (B) | **COMPLETE** |
| **PSU Calculator** | Sum of CPU + GPU TDP with +60W base overhead | `totalPowerWatts` math | **COMPLETE** |
| **Storage Validation** | Interface speeds (NVMe PCIe 4.0 vs SATA) audits | scoreBreakdown.storageSpeed | **COMPLETE** |
| **Bottleneck Analysis** | CPU performance bottleneck indexing | `detailedBottlenecks` array | **COMPLETE** |
| **Gaming Score** | High FPS suitability estimation | `gamingSuitability` rating | **COMPLETE** |
| **Productivity Score** | Core rendering & office suite workload rates| `officeSuitability` rating | **COMPLETE** |
| **Thermal Score** | Calculated component thermal and cooler warnings | `evaluatePCBuild()` rule (F) | **COMPLETE** |
| **Upgrade Suggestions** | Sourcing automated compatibility alternative parts | `suggestions` logic | **COMPLETE** |
| **Budget Optimizer** | Live conversion to PKR & margin boundaries | `estimatedPKR` currency index | **COMPLETE** |
| **Price Aggregation Engine** | Live parts catalog scraping fallback index | `pcComponents.ts` catalog | **PARTIAL** |
| **Technician Build Workflow** | Assigning active builds, reviews and tickets | `db.addPCBuildRequest` | **COMPLETE** |
| **Build Approval Lifecycle** | State triggers (Submitted, Reviewed, Approved) | `BuildRequestStatus` types | **COMPLETE** |
| **Build History** | Historic repository preservation | `db.getPCBuildsByUser` | **COMPLETE** |
| **Build Sharing** | Exporting copy-extractable markdown | `handleExportReport` panel | **COMPLETE** |
| **Build Request System** | Asking for certified technicians' review | `sendForReview()` hook | **COMPLETE** |

---

## 2. In-Depth Gap Analysis & Engineering Review

### 2.1 Complete Elements Audit (The Strengths)
*   **Intelligent Validation Engine**: The validation check goes beyond simple True/False outputs. If a CPU is paired with an incorrect motherboard socket, a typed replacement option (e.g., LGA1700 or AM5 equivalents) is retrieved from `/services/pcComponents.ts` and proposed instantly inside the suggestions panel.
*   **High Performance Deconstruction**: Decomposing `BuildPlanner.tsx` into modular panels (`BuildScorePanel` and `BuildSuggestionsPanel`) isolates logic cleanly, maintaining an agile, responsive rendering layout.
*   **Hardware Sizing Constraint Enforcement**: Form factor metrics prevent oversized components (such as ATX Motherboards) from being mapped to smaller enclosures (such as mATX Cases and compact ITX towers), returning a hard `FAIL` block.

### 2.2 Partial Elements (Areas for Future Upgrade)
*   **Live Price Aggregation**: Parts prices are currently pre-indexed inside the `/services/pcComponents.ts` database. While these represent accurate market rates (converting locally via the PKR exchange rate lock of 280), integrating a scraping route (e.g., calling Amazon/Newegg product APIs) would enable real-time tracking of hardware stock levels.

---

## 3. Recommended Architectural Fixes
1.  **Price Scraping Module (Python FastAPI side)**: Add a simple Beautiful Soup or Selenium web scraper in `/backend/main.py` under the route `GET /api/v1/scraper/prices` to query local hardware vendors and dynamically update `/services/pcComponents.ts` via standard JSON handshakes.
2.  **Add Shared Link Generation (Client-Side)**: Add a short, encoded URL serializer (e.g. `btoa(JSON.stringify(buildSelection))`) so users can copy a direct web link to instantly share their customized builds with other users or technicians.
