import Dexie from 'dexie';

/**
 * The on-device database.
 *
 * One Dexie database per user (`dinki_<userId>`). Shared phones are the norm in
 * this market, so namespacing is not a nicety: without it, a second tailor
 * logging in on the same handset would open the first tailor's customer list.
 *
 * Sync metadata lives in flat `_`-prefixed columns rather than a nested object
 * because IndexedDB can only index top-level paths, and the sync engine queries
 * on exactly these.
 */

// Bump when the schema changes. Dexie runs the upgrade path automatically.
const SCHEMA_VERSION = 1;

const STORES = {
  // `_deleted` and `_syncState` are indexed so list views can filter tombstones
  // and the status dots can be computed without scanning every row.
  customers: 'id, name, _deleted, _syncState, updated_at',
  jobs: 'id, customer_id, status, due_date, _deleted, _syncState, created_at',

  // `++seq` gives strict FIFO for free — the order operations were performed is
  // the order they must be replayed, because a job's customer has to exist first.
  outbox: '++seq, &id, status, entity, entity_id, [entity+entity_id]',

  // Cursors, last-sync timestamps, and anything else the engine needs to survive
  // a reload. Keyed by a plain string.
  meta: 'key',
};

let db = null;
let openUserId = null;

// Bumped every time a database is opened or closed.
//
// React components can mount before the database finishes opening — a live query
// that ran in that window would return nothing and, because Dexie only re-runs on
// *table* changes, would stay empty forever. Hooks include this counter in their
// dependencies so they re-run the instant a database becomes available.
let generation = 0;
const generationListeners = new Set();

function bumpGeneration() {
  generation += 1;
  generationListeners.forEach((fn) => {
    try {
      fn(generation);
    } catch {
      /* a broken subscriber must not block the others */
    }
  });
}

export function getDbGeneration() {
  return generation;
}

export function subscribeDbGeneration(fn) {
  generationListeners.add(fn);
  return () => generationListeners.delete(fn);
}

export function getDb() {
  if (!db) throw new Error('Local database is not open — call openDb(userId) first');
  return db;
}

export function currentDbUserId() {
  return openUserId;
}

export function isDbOpen() {
  return Boolean(db);
}

/**
 * Open (or switch to) a user's local database. Idempotent for the same user, so
 * callers don't have to track whether it's already open.
 */
export function openDb(userId) {
  if (!userId) throw new Error('openDb requires a userId');
  if (db && openUserId === userId) return db;
  if (db) {
    db.close();
    db = null;
  }
  db = new Dexie(`dinki_${userId}`);
  db.version(SCHEMA_VERSION).stores(STORES);
  openUserId = userId;
  bumpGeneration();
  return db;
}

export function closeDb() {
  if (db) db.close();
  db = null;
  openUserId = null;
  bumpGeneration();
}

/**
 * Destroy a user's local data. Only ever called on explicit logout — never on an
 * expired token, because the outbox may still hold work that has not reached the
 * server, and silently deleting a tailor's unsynced day is the worst failure
 * this system can have.
 */
export async function destroyDb(userId) {
  const name = `dinki_${userId}`;
  if (db && openUserId === userId) {
    db.close();
    db = null;
    openUserId = null;
    bumpGeneration();
  }
  await Dexie.delete(name);
}

// --- meta helpers ----------------------------------------------------------

export async function getMeta(key, fallback = null) {
  const row = await getDb().meta.get(key);
  return row ? row.value : fallback;
}

export async function setMeta(key, value) {
  await getDb().meta.put({ key, value });
}

export const META = {
  CURSOR: 'sync.cursor',
  LAST_PULL_AT: 'sync.lastPullAt',
  LAST_PUSH_AT: 'sync.lastPushAt',
  LAST_ERROR: 'sync.lastError',
  SEEDED: 'sync.seeded',
};

/**
 * Sync state of a single record, used by the status dots.
 *
 * 'pending' — has unsent local changes sitting in the outbox
 * 'synced'  — the server has confirmed this exact version
 * 'failed'  — the server rejected it; needs the user to look
 */
export const SYNC_STATE = {
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
};
