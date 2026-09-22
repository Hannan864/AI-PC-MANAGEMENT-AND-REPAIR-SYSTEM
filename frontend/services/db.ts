
import { SystemStats, AuditLog, Alert } from '../types';
import {
  addPCBuild,
  getPCBuildsByUser,
  deletePCBuild,
  addPCBuildRequest,
  getPCBuildRequestsByUser,
  getAllPCBuildRequests,
  addUserHistory,
  getUserHistory,
  addTechnicianAction,
  getAllUsers,
  getAllRepairRequests
} from './dbHelpers';

const DB_NAME = 'SystemSentinelDB_v10';
const DB_VERSION = 1;

export class SentinelDB {
  private db: IDBDatabase | null = null;

  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('metrics')) db.createObjectStore('metrics', { keyPath: 'timestamp' });
        if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('alerts')) db.createObjectStore('alerts', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('schedules')) db.createObjectStore('schedules', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('gigs')) db.createObjectStore('gigs', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('repair_requests')) db.createObjectStore('repair_requests', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('diagnostic_snapshots')) db.createObjectStore('diagnostic_snapshots', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('issue_classifications')) db.createObjectStore('issue_classifications', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('routing_logs')) db.createObjectStore('routing_logs', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('ai_decision_logs')) db.createObjectStore('ai_decision_logs', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('user_overrides')) db.createObjectStore('user_overrides', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('technician_actions')) db.createObjectStore('technician_actions', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('job_lifecycle_logs')) db.createObjectStore('job_lifecycle_logs', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('sla_tracking')) db.createObjectStore('sla_tracking', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('technician_updates')) db.createObjectStore('technician_updates', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('pc_builds')) db.createObjectStore('pc_builds', { keyPath: 'buildId' });
        if (!db.objectStoreNames.contains('pc_build_requests')) db.createObjectStore('pc_build_requests', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('user_history')) db.createObjectStore('user_history', { keyPath: 'historyId' });
      };
      request.onsuccess = (e: any) => {
        this.db = e.target.result;
        resolve();
      };
      request.onerror = () => {
        this.initPromise = null;
        reject('Failed to open SentinelDB');
      }
    });

    return this.initPromise;
  }

  async saveMetric(metric: SystemStats): Promise<void> {
    return this.perform('metrics', 'readwrite', (store) => store.put(metric));
  }

  async getMetrics(limit = 100): Promise<SystemStats[]> {
    return new Promise((resolve) => {
      this.perform('metrics', 'readonly', (store) => {
        const request = store.getAll(null, limit);
        request.onsuccess = () => resolve(request.result);
      });
    });
  }

  async addLog(log: AuditLog): Promise<void> {
    const uniqueId = `${log.timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    return this.perform('logs', 'readwrite', (store) => store.add({ ...log, id: log.id || uniqueId }));
  }

  async getLogs(): Promise<AuditLog[]> {
    return new Promise((resolve) => {
      this.perform('logs', 'readonly', (store) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result.sort((a: any, b: any) => b.timestamp - a.timestamp));
      });
    });
  }

  async addAlert(alert: Alert): Promise<void> {
    return this.perform('alerts', 'readwrite', (store) => store.put(alert));
  }

  async getAlerts(): Promise<Alert[]> {
    return new Promise((resolve) => {
      this.perform('alerts', 'readonly', (store) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result.sort((a: any, b: any) => b.timestamp - a.timestamp));
      });
    });
  }

  async setSetting(key: string, value: any): Promise<void> {
    return this.perform('settings', 'readwrite', (store) => store.put({ key, value }));
  }

  async getSetting(key: string): Promise<any> {
    return new Promise((resolve) => {
      this.perform('settings', 'readonly', (store) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result?.value);
      });
    });
  }

  async addUser(user: any): Promise<void> {
    return this.perform('users', 'readwrite', (store) => store.put(user));
  }

  async getUserByEmail(email: string): Promise<any | null> {
    return new Promise((resolve) => {
      this.perform('users', 'readonly', (store) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const users = request.result;
          const user = users.find((u: any) => u.email === email);
          resolve(user || null);
        };
      });
    });
  }
  
  async getUserById(id: string): Promise<any | null> {
    return new Promise((resolve) => {
      this.perform('users', 'readonly', (store) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
      });
    });
  }

  async addSession(session: any): Promise<void> {
    return this.perform('sessions', 'readwrite', (store) => store.put(session));
  }

  async getSession(id: string): Promise<any | null> {
    return new Promise((resolve) => {
      this.perform('sessions', 'readonly', (store) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
      });
    });
  }

  async deleteSession(id: string): Promise<void> {
    return this.perform('sessions', 'readwrite', (store) => store.delete(id));
  }
  
  // Gig Management
  async addGig(gig: any): Promise<void> {
    return this.perform('gigs', 'readwrite', (store) => store.put(gig));
  }

  async getGigs(): Promise<any[]> {
    return new Promise((resolve) => {
      this.perform('gigs', 'readonly', (store) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
      });
    });
  }

  async getGigsByTechnician(technicianId: string): Promise<any[]> {
    return new Promise((resolve) => {
      this.perform('gigs', 'readonly', (store) => {
        const request = store.getAll();
        request.onsuccess = () => {
          resolve((request.result || []).filter((g: any) => g.technicianId === technicianId));
        };
      });
    });
  }

  async deleteGig(id: string): Promise<void> {
    return this.perform('gigs', 'readwrite', (store) => store.delete(id));
  }

  // Repair Requests
  async addRepairRequest(req: any): Promise<void> {
    return this.perform('repair_requests', 'readwrite', (store) => store.put(req));
  }

  async getRepairRequestsByUser(userId: string): Promise<any[]> {
    return new Promise((resolve) => {
      this.perform('repair_requests', 'readonly', (store) => {
        const request = store.getAll();
        request.onsuccess = () => {
          resolve((request.result || []).filter((r: any) => r.userId === userId));
        };
      });
    });
  }

  async getRepairRequestsByTechnician(technicianId: string): Promise<any[]> {
    return new Promise((resolve) => {
      this.perform('repair_requests', 'readonly', (store) => {
        const request = store.getAll();
        request.onsuccess = () => {
          resolve((request.result || []).filter((r: any) => r.technicianId === technicianId || !r.technicianId)); // Include general requests
        };
      });
    });
  }

  // Diagnostic Snapshots
  async addDiagnosticSnapshot(snapshot: any): Promise<void> {
    return this.perform('diagnostic_snapshots', 'readwrite', (store) => store.put(snapshot));
  }

  async getDiagnosticSnapshot(id: string): Promise<any | null> {
    return new Promise((resolve) => {
      this.perform('diagnostic_snapshots', 'readonly', (store) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
      });
    });
  }

  async addPCBuild(build: any): Promise<void> {
    return addPCBuild(this.perform.bind(this), build);
  }

  async getPCBuildsByUser(userId: string): Promise<any[]> {
    return getPCBuildsByUser(this.perform.bind(this), userId);
  }

  async deletePCBuild(buildId: string): Promise<void> {
    return deletePCBuild(this.perform.bind(this), buildId);
  }

  async addPCBuildRequest(request: any): Promise<void> {
    return addPCBuildRequest(this.perform.bind(this), request);
  }

  async getPCBuildRequestsByUser(userId: string): Promise<any[]> {
    return getPCBuildRequestsByUser(this.perform.bind(this), userId);
  }

  async getAllPCBuildRequests(): Promise<any[]> {
    return getAllPCBuildRequests(this.perform.bind(this));
  }

  async addUserHistory(history: any): Promise<void> {
    return addUserHistory(this.perform.bind(this), history);
  }

  async getUserHistory(userId: string): Promise<any[]> {
    return getUserHistory(this.perform.bind(this), userId);
  }

  async addTechnicianAction(action: any): Promise<void> {
    return addTechnicianAction(this.perform.bind(this), action);
  }

  async getAllUsers(): Promise<any[]> {
    return getAllUsers(this.perform.bind(this));
  }

  async getAllRepairRequests(): Promise<any[]> {
    return getAllRepairRequests(this.perform.bind(this));
  }

  perform(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      try {
        const tx = this.db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        action(store);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject('Transaction error');
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const db = new SentinelDB();
