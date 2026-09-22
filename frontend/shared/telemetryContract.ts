/**
 * TELEMETRY CONTRACT (SHARED LAYER)
 * 
 * This file serves as the single source of truth for both the Frontend (TypeScript)
 * and the Backend (Python Pydantic equivalent mapping).
 * 
 * Strict alignment to these contract schemas is required to ensure 100% telemetry
 * deserialization reliability and safe diagnostics.
 */

// ==========================================
// 1. SYSTEM STATS CONTRACT
// ==========================================
/**
 * Python/Pydantic equivalent:
 * class SystemStatsModel(BaseModel):
 *     cpu: float
 *     ram: float
 *     disk: float
 *     temp: float
 *     networkDown: float
 *     networkUp: float
 *     timestamp: int
 *     batteryLevel: Optional[float] = None
 *     isCharging: Optional[bool] = None
 */
export interface SystemStats {
  cpu: number;
  ram: number;
  disk: number;
  temp: number;
  networkDown: number;
  networkUp: number;
  timestamp: number;
  batteryLevel?: number;
  isCharging?: boolean;
}

// ==========================================
// 2. NETWORK METRICS CONTRACT
// ==========================================
/**
 * Python/Pydantic equivalent:
 * class NetworkForensicItem(BaseModel):
 *     name: str
 *     down: str
 *     up: str
 *     type: str
 * 
 * class NetworkMetricsModel(BaseModel):
 *     latency: float
 *     forensics: List[NetworkForensicItem]
 */
export interface NetworkForensicItem {
  name: string;
  down: string;
  up: string;
  type: string;
}

export interface NetworkMetrics {
  latency: number;
  forensics: NetworkForensicItem[];
}

// ==========================================
// 3. STORAGE METRICS CONTRACT
// ==========================================
/**
 * Python/Pydantic equivalent:
 * class StorageReportModel(BaseModel):
 *     path: str
 *     size: int
 *     lastModified: int
 *     isLarge: bool
 * 
 * class StorageMetricsModel(BaseModel):
 *     files: List[StorageReportModel]
 *     totalSize: int
 */
export interface StorageReport {
  path: string;
  size: number;
  lastModified: number;
  isLarge: boolean;
}

export interface StorageMetrics {
  files: StorageReport[];
  totalSize: number;
}

// ==========================================
// 4. SECURITY & INTEGRITY METRICS CONTRACT
// ==========================================
/**
 * Python/Pydantic equivalent:
 * class SecurityIntegrityItem(BaseModel):
 *     name: str
 *     status: str
 * 
 * class StabilityEventModel(BaseModel):
 *     id: str
 *     label: str
 *     details: str
 *     timestamp: int
 *     type: Literal['rose', 'amber']
 * 
 * class SecurityMetricsModel(BaseModel):
 *     integrity: List[SecurityIntegrityItem]
 *     events: List[StabilityEventModel]
 */
export interface SecurityIntegrityItem {
  name: string;
  status: string;
}

export interface StabilityEvent {
  id: string;
  label: string;
  details: string;
  timestamp: number;
  type: 'rose' | 'amber';
}

export interface SecurityMetrics {
  integrity: SecurityIntegrityItem[];
  events: StabilityEvent[];
}

// ==========================================
// 5. HARDWARE CONTRACT
// ==========================================
/**
 * Python/Pydantic equivalent:
 * class HardwareComponent(BaseModel):
 *     name: str
 *     category: str
 *     status: str
 *     version: str
 * 
 * class HardwareInventoryModel(BaseModel):
 *     inventory: List[HardwareComponent]
 */
export interface HardwareComponent {
  name: string;
  category: string;
  status: string;
  version: string;
}

export interface HardwareMetrics {
  inventory: HardwareComponent[];
}
