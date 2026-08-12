import { getDb, getMeta, setMeta, META, SYNC_STATE, isDbOpen } from './db';
import * as outbox from './outbox';
import { sync as syncApi } from '../api';
import { touchOnline, markRevoked } from './session';

/**
 * The background sync engine.
 *
 * Nothing in the UI ever calls into this directly or waits on it. Pages read from
 * IndexedDB and write to IndexedDB plus the outbox; this drains the outbox and
 * refreshes local data whenever the network happens to be usable.
 */

const PUSH_BATCH = 50;
const PERIODIC_MS = 5 * 60_000;
const DEBOUNCE_MS = 2_000;

// Entity name in the outbox → Dexie table name.
const TABLE_FOR = { customer: 'customers', job: 'jobs' };

let running = false;
let queuedReason = null;
let debounceTimer = null;
let periodicTimer = null;
let listeners = new Set();
let state = {
  status: 'idle',      // 'idle' | 'syncing' | 'offline' | 'error' | 'auth'
  pending: 0,
  failed: 0,
  lastSyncAt: null,
  error: null,
};

// --- observable status ------------------------------------------------------

export function subscribe(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export function getStatus() {
  return state;
}

function setState(patch) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch {
      /* a broken subscriber must not stop the engine */
    }
  });
}

async function refreshCounts() {
  if (!isDbOpen()) return;
  const [pending, failed] = await Promise.all([
    outbox.pendingCount(),
    outbox.failedEntries().then((r) => r.length),
  ]);
  setState({ pending, failed });
}

// --- helpers ----------------------------------------------------------------

function isOffline() {
  // navigator.onLine only proves there's *a* network — a wifi captive portal
  // reports online. Treat false as authoritative and true as a hint; real
  // failures then drive the backoff.
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function isAuthError(err) {
  return err?.status === 401 || err?.code === 'AUTH_REQUIRED' || err?.code === 'INVALID_TOKEN';
}

function isNetworkError(err) {
  return err?.code === 'NETWORK_ERROR' || err?.status === 502 || err?.status === 503 || err?.status === 504;
}

// --- push -------------------------------------------------------------------

async function pushOnce() {
  const db = getDb();
  const batch = await outbox.nextBatch(PUSH_BATCH);
  if (!batch.length) return { pushed: 0, done: true };

  await outbox.markInflight(batch.map((e) => e.seq));

  let response;
  try {
    response = await syncApi.push(
      batch.map((e) => ({
        id: e.id,
        entity: e.entity,
        op: e.op,
        entity_id: e.entity_id,
        patch: e.patch || {},
      }))
    );
  } catch (err) {
    // Never reached the server (or the server is broken) — keep everything and
    // retry. Not burning an attempt here is deliberate: a week of bad signal
    // must not exhaust a record's retries and quarantine honest work.
    await outbox.markRetry(batch.map((e) => e.seq), err.message);
    throw err;
  }

  const results = response?.data?.results || [];
  const bySeq = new Map(batch.map((e) => [e.id, e]));
  const done = [];
  let halted = false;

  for (const result of results) {
    const entry = bySeq.get(result.id);
    if (!entry) continue;

    if (result.status === 'applied' || result.status === 'replayed') {
      done.push(entry.seq);
      // Adopt the server's canonical version of the row so local state matches
      // exactly what was stored — including fields the server derived, like
      // initials or avatar colour.
      if (result.record && TABLE_FOR[entry.entity]) {
        await applyServerRecord(db, TABLE_FOR[entry.entity], result.record);
      }
    } else if (result.status === 'rejected') {
      await outbox.markFailed(entry.seq, result.error);
      halted = true;
    } else if (result.status === 'retry') {
      await outbox.markRetry([entry.seq], result.error?.message);
      halted = true;
    } else if (result.status === 'skipped') {
      await outbox.markRetry([entry.seq], null);
    }
  }

  if (done.length) await outbox.markDone(done);

  // Any entry the server didn't mention at all (truncated response, proxy cut
  // the body short) goes back to pending rather than being assumed applied.
  const answered = new Set(results.map((r) => r.id));
  const unanswered = batch.filter((e) => !answered.has(e.id)).map((e) => e.seq);
  if (unanswered.length) await outbox.markRetry(unanswered, null);

  await setMeta(META.LAST_PUSH_AT, Date.now());
  return { pushed: done.length, done: halted || batch.length < PUSH_BATCH };
}

// --- pull -------------------------------------------------------------------

async function applyServerRecord(db, tableName, record) {
  const table = db[tableName];
  const entity = tableName === 'customers' ? 'customer' : 'job';

  if (record.deleted_at) {
    // A tombstone. Keep the row but mark it gone so queries filter it and any
    // open detail screen can say the record was removed, rather than a row
    // silently vanishing under the user's finger.
    const existing = await table.get(record.id);
    if (existing) await table.update(record.id, { _deleted: 1, _syncState: SYNC_STATE.SYNCED });
    return;
  }

  const pending = await outbox.pendingPatchesFor(entity, record.id);

  // Field-level last-write-wins. The server row is the base; unsent local edits
  // go back on top, because those fields are ones the server has not seen yet.
  // A phone that changed `waist` and a laptop that changed `due_date` therefore
  // both keep their change.
  let merged = { ...record };
  for (const entry of pending) {
    if (entry.op === 'update' || entry.op === 'create') {
      merged = { ...merged, ...entry.patch };
    }
  }

  await table.put({
    ...merged,
    _deleted: 0,
    _syncState: pending.length ? SYNC_STATE.PENDING : SYNC_STATE.SYNCED,
    _syncedAt: Date.now(),
  });
}

async function pullOnce() {
  const db = getDb();
  let cursor = await getMeta(META.CURSOR, null);
  let guard = 0;

  for (;;) {
    // A bug that never advances the cursor would otherwise loop forever and
    // burn a user's data bundle.
    guard += 1;
    if (guard > 50) break;

    const response = await syncApi.pull({ cursor, limit: 200 });
    const payload = response?.data;
    if (!payload) break;

    const { customers = [], jobs = [] } = payload.entities || {};

    await db.transaction('rw', db.customers, db.jobs, db.outbox, async () => {
      for (const record of customers) await applyServerRecord(db, 'customers', record);
      for (const record of jobs) await applyServerRecord(db, 'jobs', record);
    });

    cursor = payload.cursor;
    await setMeta(META.CURSOR, cursor);

    if (!payload.has_more) break;
  }

  await setMeta(META.LAST_PULL_AT, Date.now());
  await setMeta(META.SEEDED, true);
}

// --- orchestration ----------------------------------------------------------

async function runSync(reason) {
  if (!isDbOpen()) return;

  if (isOffline()) {
    setState({ status: 'offline' });
    await refreshCounts();
    return;
  }

  setState({ status: 'syncing', error: null });

  // Push and pull are attempted independently. An earlier version aborted the
  // pull whenever the push threw, which meant one phone with a stubbornly
  // failing upload would stop receiving other devices' changes altogether —
  // it would slowly drift out of date while looking perfectly healthy.
  let pushError = null;
  let pullError = null;

  // Push first: local work reaches the server before the pull that follows, so
  // the pull returns rows that already include it. Reversing this produces a
  // visible flicker where a just-saved edit reverts and then reappears.
  try {
    for (let i = 0; i < 20; i += 1) {
      const { done } = await pushOnce();
      if (done) break;
    }
  } catch (err) {
    pushError = err;
  }

  try {
    await pullOnce();
  } catch (err) {
    pullError = err;
  }

  const failure = pullError || pushError;

  if (!failure) {
    // Proof of real server contact — this is what keeps the 30-day offline
    // window rolling forward for someone who syncs even occasionally.
    touchOnline();
    setState({ status: 'idle', lastSyncAt: Date.now(), error: null });
  } else if (isAuthError(failure)) {
    // The session is gone. Local data stays readable and the outbox stays
    // intact — the user just needs to log in again before it can drain.
    markRevoked();
    setState({ status: 'auth', error: 'Please sign in again to sync' });
  } else if (isNetworkError(failure) || isOffline()) {
    setState({ status: 'offline', error: null });
  } else {
    setState({ status: 'error', error: failure.message || 'Sync failed' });
    await setMeta(META.LAST_ERROR, failure.message || String(failure));
  }

  await refreshCounts();
}

/**
 * Request a sync. Safe to call from anywhere, as often as you like.
 *
 * Only one sync runs at a time. A request that arrives mid-sync sets a flag so a
 * single follow-up run happens afterwards, instead of queueing N redundant runs.
 */
export async function syncNow(reason = 'manual') {
  if (running) {
    queuedReason = reason;
    return;
  }
  running = true;
  try {
    await withCrossTabLock(() => runSync(reason));
  } finally {
    running = false;
    if (queuedReason) {
      const next = queuedReason;
      queuedReason = null;
      setTimeout(() => syncNow(next), 0);
    }
  }
}

/**
 * Two open tabs pushing the same outbox would double-send every operation. Web
 * Locks serialises them; where it's unavailable (older WebViews) we fall back to
 * the in-process guard, which still covers the common single-tab case.
 */
async function withCrossTabLock(fn) {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request('dinki-sync', { mode: 'exclusive' }, fn);
  }
  return fn();
}

/** Coalesce the burst of saves from a user filling in a form into one sync. */
export function scheduleSync(reason = 'mutation') {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => syncNow(reason), DEBOUNCE_MS);
}

let wired = false;

/**
 * Start background syncing. Called once the user's local DB is open.
 *
 * The `online` listener is the one that matters most: it is what makes a phone
 * that walks back into coverage upload a day's work with nobody tapping anything.
 */
export function startSync() {
  if (wired) return;
  wired = true;

  const onOnline = () => syncNow('online');
  const onVisible = () => {
    if (document.visibilityState === 'visible') syncNow('focus');
  };

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', () => setState({ status: 'offline' }));
  document.addEventListener('visibilitychange', onVisible);

  periodicTimer = setInterval(() => syncNow('periodic'), PERIODIC_MS);

  stopSync.teardown = () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
    clearInterval(periodicTimer);
    clearTimeout(debounceTimer);
    wired = false;
  };
}

export function stopSync() {
  if (stopSync.teardown) stopSync.teardown();
  stopSync.teardown = null;
  // Always clear the timers, even if startSync was never called — a debounced
  // sync left armed after logout would fire against a closed database.
  clearTimeout(debounceTimer);
  clearInterval(periodicTimer);
  debounceTimer = null;
  periodicTimer = null;
  queuedReason = null;
}

/**
 * Bring a freshly opened database up to date.
 *
 * Requeues anything stranded mid-flight by a crash, then syncs. The first run for
 * a user has no cursor, so the pull seeds the entire dataset — which is exactly
 * what "log in once on wifi, then work all week offline" needs.
 */
export async function bootstrapSync() {
  await outbox.resetStale();
  await refreshCounts();
  await syncNow('boot');
}
