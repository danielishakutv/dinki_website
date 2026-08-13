import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { customersRepo, jobsRepo } from '../lib/local/repo';
import { computeLocalAnalytics } from '../lib/local/analytics';
import { isDbOpen, getDbGeneration, subscribeDbGeneration } from '../lib/local/db';
import { subscribe, getStatus, syncNow } from '../lib/local/sync';

/**
 * Reactive reads from the local database.
 *
 * `useLiveQuery` re-runs the query whenever the underlying tables change, so a
 * record saved on one screen updates every other screen showing it — including
 * when the background sync engine writes rows fetched from the server. No
 * polling, no manual cache invalidation, and no loading spinner after first
 * paint, because the data is already on the device.
 */

function useRepoQuery(fn, deps) {
  // A component can easily mount before the database has been opened — the login
  // response and the first render race. Without this, the query would run once
  // against no database and never re-run, because Dexie only re-triggers on table
  // changes and there was no table to watch.
  const generation = useSyncExternalStore(
    subscribeDbGeneration,
    getDbGeneration,
    getDbGeneration
  );

  const result = useLiveQuery(async () => {
    if (!isDbOpen()) return undefined;
    return fn();
  }, [...deps, generation]);

  // useLiveQuery yields `undefined` until its first run resolves. That is the
  // only moment there is genuinely nothing to show.
  return { data: result, loading: result === undefined };
}

export function useCustomers({ search } = {}) {
  return useRepoQuery(() => customersRepo.list({ search }), [search]);
}

export function useCustomer(id) {
  return useRepoQuery(() => (id ? customersRepo.get(id) : null), [id]);
}

export function useJobs({ status, search, customerId, overdue } = {}) {
  return useRepoQuery(
    () => jobsRepo.list({ status, search, customerId, overdue }),
    [status, search, customerId, overdue]
  );
}

export function useJob(id) {
  return useRepoQuery(() => (id ? jobsRepo.get(id) : null), [id]);
}

export function useJobStats() {
  return useRepoQuery(() => jobsRepo.stats(), []);
}

/**
 * Business analytics derived from the device's own data, so the page works with
 * no signal. Only storefront visits, orders, reviews and referrals need the API.
 */
export function useLocalAnalytics({ days = 30 } = {}) {
  return useRepoQuery(() => computeLocalAnalytics({ days }), [days]);
}

/** Live sync status for the header pill and the per-row dots. */
export function useSyncStatus() {
  return useSyncExternalStore(subscribe, getStatus, getStatus);
}

/** Whether the device currently believes it has a network. */
export function useOnline() {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine !== false
  );

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return online;
}

export { syncNow };
