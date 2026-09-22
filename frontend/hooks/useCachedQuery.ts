
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Enterprise in-memory cache for API responses.
 * Provides stale-while-revalidate behavior with error logging and timeout protection.
 */
const cache = new Map<string, { data: any; timestamp: number }>();

function getCached<T>(key: string, maxAgeMs: number): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > maxAgeMs) return null;
  return entry.data as T;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`[useCachedQuery] Timeout after ${ms}ms`)), ms);
    }),
  ]).finally(() => globalThis.clearTimeout(timeoutId));
}

export interface UseCachedQueryOptions<T> {
  staleTimeMs: number;
  fetchFn: () => Promise<T>;
  defaultValue: T;
  polling?: boolean;
}

export interface UseCachedQueryResult<T> {
  data: T;
  isRefreshing: boolean;
  lastUpdated: number;
  refetch: () => Promise<void>;
}

export function useCachedQuery<T>(
  key: string,
  options: UseCachedQueryOptions<T>
): UseCachedQueryResult<T> {
  const { staleTimeMs, fetchFn, defaultValue, polling = true } = options;
  const [data, setData] = useState<T>(() => {
    const cached = getCached<T>(key, Infinity);
    return cached !== null ? cached : defaultValue;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => {
    const entry = cache.get(key);
    return entry ? entry.timestamp : 0;
  });
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);

  const doFetch = useCallback(async (isBackground: boolean) => {
    const id = ++fetchIdRef.current;
    if (!isBackground) setIsRefreshing(true);
    const startTime = Date.now();
    try {
      const result = await withTimeout(fetchFn(), 12000);
      const duration = Date.now() - startTime;
      if (id !== fetchIdRef.current || !mountedRef.current) {
        console.warn(`[useCachedQuery:${key}] Stale response discarded (${duration}ms)`);
        return;
      }
      setData(result);
      setCache(key, result);
      setLastUpdated(Date.now());
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(`[useCachedQuery:${key}] Fetch failed (${duration}ms):`, err);
      // Keep previous data on error — never replace with zeros
      const cached = getCached<T>(key, Infinity);
      if (cached !== null) {
        console.warn(`[useCachedQuery:${key}] Falling back to cached data`);
      }
    } finally {
      if (id === fetchIdRef.current && mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [key, fetchFn]);

  useEffect(() => {
    mountedRef.current = true;
    doFetch(true);
    if (!polling) return () => { mountedRef.current = false; };
    const interval = setInterval(() => doFetch(true), staleTimeMs);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [key, staleTimeMs, polling, doFetch]);

  return { data, isRefreshing, lastUpdated, refetch: () => doFetch(false) };
}
