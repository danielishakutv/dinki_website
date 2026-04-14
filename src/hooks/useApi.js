import { useState, useEffect, useCallback, useRef } from 'react';

// ─── In-memory SWR cache ───────────────────────────────────────────
const cache = new Map();       // key → { data, timestamp }
const inflight = new Map();    // key → Promise (deduplication)
const subscribers = new Map(); // key → Set<callback>

// Default TTLs (ms) — data younger than this is served from cache without revalidating
const TTL = {
  short: 30 * 1000,      // 30s — notifications, unread counts
  medium: 2 * 60 * 1000, // 2min — lists (jobs, customers, conversations)
  long: 5 * 60 * 1000,   // 5min — profile, stats, detail pages
};

function getCacheEntry(key) {
  return cache.get(key) || null;
}

function setCacheEntry(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  // Notify all subscribers of this key
  const subs = subscribers.get(key);
  if (subs) subs.forEach((cb) => cb(data));
}

// Invalidate cache entries matching a prefix pattern
// e.g. invalidateCache('jobs') clears jobs list + all job detail pages
function invalidateCache(...patterns) {
  for (const [key] of cache) {
    if (patterns.some((p) => key.startsWith(p))) {
      cache.delete(key);
    }
  }
}

// Clear entire cache (on logout)
function clearCache() {
  cache.clear();
  inflight.clear();
}

// Core fetcher with deduplication + stale-while-revalidate
async function cachedFetch(key, fetcher, ttl = TTL.medium) {
  const entry = getCacheEntry(key);
  const now = Date.now();
  const isFresh = entry && (now - entry.timestamp < ttl);

  // Fresh cache — return instantly, no network call
  if (isFresh) return entry.data;

  // Deduplicate: if same request is already in-flight, reuse it
  if (inflight.has(key)) return inflight.get(key);

  const promise = (async () => {
    try {
      const result = await fetcher();
      setCacheEntry(key, result);
      return result;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);

  // If we have stale data, return it immediately — the promise revalidates in background
  if (entry) {
    promise.catch(() => {}); // suppress unhandled rejection for background revalidation
    return entry.data;
  }

  // No cached data — must wait for network
  return promise;
}

// ─── React Hook ────────────────────────────────────────────────────
// Usage: const { data, loading, error, refresh } = useApi('jobs-list', () => jobsApi.list({limit:100}), { ttl: TTL.medium })
export function useApi(key, fetcher, options = {}) {
  const { ttl = TTL.medium, enabled = true } = options;
  const entry = getCacheEntry(key);
  const [data, setData] = useState(entry?.data ?? null);
  const [loading, setLoading] = useState(!entry);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const keyRef = useRef(key);
  keyRef.current = key;

  const load = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;
    try {
      if (forceRefresh) {
        cache.delete(keyRef.current);
      }
      // If we have cached data, don't show loading spinner
      const cached = getCacheEntry(keyRef.current);
      if (!cached) setLoading(true);

      const result = await cachedFetch(keyRef.current, fetcher, ttl);
      if (mountedRef.current) {
        setData(result);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
      }
    }
  }, [fetcher, ttl, enabled]);

  // Subscribe to cache updates for this key (cross-component sync)
  useEffect(() => {
    if (!subscribers.has(key)) subscribers.set(key, new Set());
    const cb = (newData) => {
      if (mountedRef.current) setData(newData);
    };
    subscribers.get(key).add(cb);
    return () => {
      subscribers.get(key)?.delete(cb);
      if (subscribers.get(key)?.size === 0) subscribers.delete(key);
    };
  }, [key]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { data, loading, error, refresh };
}

// ─── Multi-key parallel fetch ──────────────────────────────────────
// Usage: const { data, loading } = useApiMulti({ jobs: [...], customers: [...] })
export function useApiMulti(queries) {
  // queries = { keyName: [cacheKey, fetcher, options?], ... }
  const keys = Object.keys(queries);
  const results = {};
  for (const k of keys) {
    const [cacheKey, fetcher, opts] = queries[k];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[k] = useApi(cacheKey, fetcher, opts);
  }

  const loading = keys.some((k) => results[k].loading);
  const data = {};
  for (const k of keys) {
    data[k] = results[k].data;
  }

  const refresh = useCallback(() => {
    keys.forEach((k) => results[k].refresh());
  }, [keys.map((k) => results[k].refresh).join(',')]);

  return { data, loading, results, refresh };
}

export { TTL, invalidateCache, clearCache, cachedFetch, getCacheEntry };
