/**
 * TELEMETRY QUEUE BUFFER
 * Queues outgoing high-frequency logs, status packets, or performance optimization commands 
 * when the Python backend is slow or offline. Employs automatic retry policies
 * and batch synchronization flushes.
 */

import { db } from './db';
import { ServiceType } from '../types';

export interface QueueItem {
  id: string;
  operation: string;
  payload: any;
  retryCount: number;
  timestamp: number;
}

export class TelemetryQueue {
  private queue: QueueItem[] = [];
  private maxRetries = 3;
  private flushInterval = 6000; // Flush/batch send every 6 seconds
  private intervalId: any = null;
  private isProcessing = false;
  
  // Custom API dispatcher placeholder
  private apiDispatcher: ((op: string, payload: any) => Promise<any>) | null = null;

  constructor() {
    this.loadPersistedQueue();
    this.startInterval();
  }

  /**
   * Set the API dispatcher function that will perform actual REST requests.
   */
  public registerDispatcher(fn: (op: string, payload: any) => Promise<any>) {
    this.apiDispatcher = fn;
  }

  /**
   * Enqueue a telemetry payload meant for the backend server.
   * If the immediate transmission fails or backend is slow, it gets buffered.
   */
  public async enqueue(operation: string, payload: any): Promise<boolean> {
    const item: QueueItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      operation,
      payload,
      retryCount: 0,
      timestamp: Date.now()
    };

    this.queue.push(item);
    this.saveQueueToStore();

    // Try processing immediately if normal state
    if (!this.isProcessing) {
      this.flushQueue();
    }
    return true;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  private async loadPersistedQueue() {
    try {
      await db.init();
      const saved = await db.getSetting('telemetry.buffered_queue');
      if (Array.isArray(saved)) {
        this.queue = saved;
        console.log(`[TelemetryQueue] Restored ${this.queue.length} buffered items from db.`);
      }
    } catch (err) {
      console.warn('[TelemetryQueue] Failed to restore persisted queue:', err);
    }
  }

  private async saveQueueToStore() {
    try {
      await db.init();
      await db.setSetting('telemetry.buffered_queue', this.queue);
    } catch (err) {
      console.warn('[TelemetryQueue] Saving queue state to db failed:', err);
    }
  }

  private startInterval() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.flushQueue();
    }, this.flushInterval);
  }

  /**
   * Attempt to transmit queued items as a batch or sequentially.
   */
  public async flushQueue() {
    if (this.isProcessing || this.queue.length === 0 || !this.apiDispatcher) {
      return;
    }

    this.isProcessing = true;
    console.log(`[TelemetryQueue] Flashing ${this.queue.length} queued telemetry payloads...`);

    const activeQueueCopy = [...this.queue];
    const remainingQueue: QueueItem[] = [];

    for (const item of activeQueueCopy) {
      let succeeded = false;
      try {
        await this.apiDispatcher(item.operation, item.payload);
        succeeded = true;
      } catch (err) {
        item.retryCount++;
        console.warn(`[TelemetryQueue] Send failed for ${item.id} (${item.operation}), retries: ${item.retryCount}/${this.maxRetries}`, err);
        
        if (item.retryCount < this.maxRetries) {
          remainingQueue.push(item);
        } else {
          // Permanently failed after 3 tries. Backup to safe auditable local index
          await this.backupFailedRequestToLog(item, err);
        }
      }
    }

    this.queue = remainingQueue;
    await this.saveQueueToStore();
    this.isProcessing = false;
  }

  private async backupFailedRequestToLog(item: QueueItem, err: any) {
    try {
      await db.init();
      await db.addLog({
        id: `queue-drop-${Date.now()}`,
        timestamp: Date.now(),
        service: ServiceType.HEALTH,
        message: `Telemetry dropped permanently after ${this.maxRetries} tries. Op: ${item.operation}. Error: ${err?.message || err}`,
        type: 'error'
      });
      console.error(`[TelemetryQueue] Payload dropped: ${item.id}. Logged failsafe.`);
    } catch (e) {
      console.error('[TelemetryQueue] Failed to backup item to db logs:', e);
    }
  }

  public clear() {
    this.queue = [];
    this.saveQueueToStore();
  }
}

export const telemetryQueue = new TelemetryQueue();
