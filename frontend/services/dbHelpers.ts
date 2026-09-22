export async function addPCBuild(
  perform: (storeName: string, mode: IDBTransactionMode, action: (store: any) => void) => Promise<any>,
  build: any
): Promise<void> {
  return perform('pc_builds', 'readwrite', (store) => store.put(build));
}

export async function getPCBuildsByUser(
  perform: (storeName: string, mode: IDBTransactionMode, action: (store: any) => void) => Promise<any>,
  userId: string
): Promise<any[]> {
  return new Promise((resolve) => {
    perform('pc_builds', 'readonly', (store) => {
      const request = store.getAll();
      request.onsuccess = () => {
        resolve((request.result || []).filter((b: any) => b.userId === userId));
      };
    });
  });
}

export async function deletePCBuild(
  perform: (storeName: string, mode: IDBTransactionMode, action: (store: any) => void) => Promise<any>,
  buildId: string
): Promise<void> {
  return perform('pc_builds', 'readwrite', (store) => store.delete(buildId));
}

export async function addPCBuildRequest(
  perform: (storeName: string, mode: IDBTransactionMode, action: (store: any) => void) => Promise<any>,
  request: any
): Promise<void> {
  return perform('pc_build_requests', 'readwrite', (store) => store.put(request));
}

export async function getPCBuildRequestsByUser(
  perform: (storeName: string, mode: IDBTransactionMode, action: (store: any) => void) => Promise<any>,
  userId: string
): Promise<any[]> {
  return new Promise((resolve) => {
    perform('pc_build_requests', 'readonly', (store) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []).filter((r: any) => r.userId === userId));
    });
  });
}

export async function getAllPCBuildRequests(
  perform: (storeName: string, mode: IDBTransactionMode, action: (store: any) => void) => Promise<any>
): Promise<any[]> {
  return new Promise((resolve) => {
    perform('pc_build_requests', 'readonly', (store) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
    });
  });
}

export async function addUserHistory(
  perform: (storeName: string, mode: IDBTransactionMode, action: (store: any) => void) => Promise<any>,
  history: any
): Promise<void> {
  return perform('user_history', 'readwrite', (store) => store.put(history));
}

export async function getUserHistory(
  perform: (storeName: string, mode: IDBTransactionMode, action: (store: any) => void) => Promise<any>,
  userId: string
): Promise<any[]> {
  return new Promise((resolve) => {
    perform('user_history', 'readonly', (store) => {
      const request = store.getAll();
      request.onsuccess = () => {
        resolve((request.result || []).filter((h: any) => h.userId === userId).sort((a: any, b: any) => b.timestamp - a.timestamp));
      };
    });
  });
}

export async function addTechnicianAction(
  perform: (storeName: string, mode: IDBTransactionMode, action: (store: any) => void) => Promise<any>,
  action: any
): Promise<void> {
  return perform('technician_actions', 'readwrite', (store) => store.put(action));
}

export async function getAllUsers(
  perform: (storeName: string, mode: IDBTransactionMode, action: (store: any) => void) => Promise<any>
): Promise<any[]> {
  return new Promise((resolve) => {
    perform('users', 'readonly', (store) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
    });
  });
}

export async function getAllRepairRequests(
  perform: (storeName: string, mode: IDBTransactionMode, action: (store: any) => void) => Promise<any>
): Promise<any[]> {
  return new Promise((resolve) => {
    perform('repair_requests', 'readonly', (store) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
    });
  });
}
