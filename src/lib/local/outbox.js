import { getDb, SYNC_STATE } from './db';
import { uuid } from './ids';

export const OUTBOX_STATUS = {
  PENDING: 'pending',
  INFLIGHT: 'inflight',
  FAILED: 'failed',
};

// Deterministic server rejections are retried this many times before the entry
// is parked for the user to deal with. Transient network failures don't count
// against this — they never reach the server, so they never increment attempts.
const MAX_ATTEMPTS = 5;

const BASE_BACKOFF_MS = 5_000;
const MAX_BACKOFF_MS = 5 * 60_000;

/**
 * Operations that must never be merged with an earlier queued operation.
 *
 * Job status is the important one. The server enforces one-step-forward
 * transitions (cutting → stitching → ready → delivered) and fires side effects
 * on each — notifying the customer, incrementing the completed-jobs counter. A
 * tailor who advances a job twice while offline must produce two ops that replay
 * in order. Coalescing them into "cutting → ready" would be rejected outright
 * and would skip a notification the customer is expecting.
 */
const NON_COALESCING = new Set(['status']);

function backoffFor(attempts) {
  const raw = Math.min(BASE_BACKOFF_MS * 2 ** attempts, MAX_BACKOFF_MS);
  // Jitter stops every queued entry on every device retrying in lockstep after a
  // tower comes back, which is how a flaky network turns into a thundering herd.
  return raw / 2 + Math.random() * (raw / 2);
}

/**
 * Queue a mutation.
 *
 * Coalescing matters more than it looks: a tailor correcting a measurement five
 * times offline should upload one operation, not five. Over a 2G link that is
 * often the difference between a sync that completes before the signal drops and
 * one that never does.
 */
export async function enqueue({ entity, op, entityId, patch = {} }) {
  const db = getDb();

  return db.transaction('rw', db.outbox, async () => {
    const queued = await db.outbox
      .where('[entity+entity_id]')
      .equals([entity, entityId])
      .toArray();

    const mergeable = queued
      .filter((e) => e.status !== OUTBOX_STATUS.INFLIGHT && !NON_COALESCING.has(e.op))
      .sort((a, b) => a.seq - b.seq);

    if (op === 'delete') {
      const pendingCreate = mergeable.find((e) => e.op === 'create');
      if (pendingCreate) {
        // Created and deleted without ever reaching the server. The server never
        // knew this record existed, so the correct upload is nothing at all.
        await db.outbox.bulkDelete(mergeable.map((e) => e.seq));
        return null;
      }
      // Any queued edits to a record that's about to be deleted are pointless.
      await db.outbox.bulkDelete(mergeable.filter((e) => e.op === 'update').map((e) => e.seq));
    }

    if (!NON_COALESCING.has(op)) {
      // Fold into a queued create so the record arrives complete, in one op.
      const create = mergeable.find((e) => e.op === 'create');
      if (create && (op === 'update' || op === 'create')) {
        await db.outbox.update(create.seq, {
          patch: { ...create.patch, ...patch },
          queued_at: Date.now(),
        });
        return create.id;
      }

      // Otherwise fold into a queued op of the same kind.
      const sameOp = mergeable.filter((e) => e.op === op).pop();
      if (sameOp) {
        await db.outbox.update(sameOp.seq, {
          patch: { ...sameOp.patch, ...patch },
          queued_at: Date.now(),
        });
        return sameOp.id;
      }
    }

    const id = uuid();
    await db.outbox.add({
      id,                      // doubles as the server-side idempotency key
      entity,
      op,
      entity_id: entityId,
      patch,
      status: OUTBOX_STATUS.PENDING,
      attempts: 0,
      next_attempt_at: 0,
      last_error: null,
      queued_at: Date.now(),
    });
    return id;
  });
}

/**
 * The next batch to upload, in the order the tailor performed the work.
 *
 * Entries whose backoff has not elapsed stop the batch rather than being skipped:
 * letting a later op jump the queue would push a job ahead of the customer it
 * belongs to.
 */
export async function nextBatch(limit = 50) {
  const db = getDb();
  const now = Date.now();
  const all = await db.outbox.orderBy('seq').toArray();

  const batch = [];
  for (const entry of all) {
    if (entry.status === OUTBOX_STATUS.FAILED) break;   // quarantined — blocks the queue
    if (entry.next_attempt_at > now) break;             // still backing off
    batch.push(entry);
    if (batch.length >= limit) break;
  }
  return batch;
}

export async function markInflight(seqs) {
  const db = getDb();
  await db.outbox.where('seq').anyOf(seqs).modify({ status: OUTBOX_STATUS.INFLIGHT });
}

export async function markDone(seqs) {
  const db = getDb();
  await db.outbox.where('seq').anyOf(seqs).delete();
}

/** Transient failure: keep the entry, back off, do NOT burn an attempt. */
export async function markRetry(seqs, message) {
  const db = getDb();
  await db.outbox.where('seq').anyOf(seqs).modify((entry) => {
    entry.status = OUTBOX_STATUS.PENDING;
    entry.next_attempt_at = Date.now() + backoffFor(entry.attempts || 0);
    entry.last_error = message || null;
  });
}

/** The server rejected this and will reject it identically forever. */
export async function markFailed(seq, error) {
  const db = getDb();
  await db.outbox.update(seq, {
    status: OUTBOX_STATUS.FAILED,
    attempts: MAX_ATTEMPTS,
    last_error: error?.message || 'This change was rejected by the server',
    error_code: error?.code || null,
  });
  // Surface it on the record itself so the row shows a red dot, not a silent stall.
  const entry = await db.outbox.get(seq);
  if (entry) await flagRecordFailed(entry);
}

async function flagRecordFailed(entry) {
  const db = getDb();
  const table = entry.entity === 'customer' ? db.customers : db.jobs;
  const row = await table.get(entry.entity_id);
  if (row) await table.update(entry.entity_id, { _syncState: SYNC_STATE.FAILED });
}

/**
 * Reset entries stranded mid-flight.
 *
 * If the app was killed (or the phone died) while a push was in progress, those
 * entries are stuck in 'inflight' forever. Requeuing them is safe because every
 * op carries an idempotency key: if the server did apply it, the replay returns
 * the original result instead of duplicating the record.
 */
export async function resetStale() {
  const db = getDb();
  await db.outbox
    .where('status')
    .equals(OUTBOX_STATUS.INFLIGHT)
    .modify({ status: OUTBOX_STATUS.PENDING, next_attempt_at: 0 });
}

export async function pendingCount() {
  const db = getDb();
  return db.outbox.where('status').notEqual(OUTBOX_STATUS.FAILED).count();
}

export async function failedEntries() {
  const db = getDb();
  return db.outbox.where('status').equals(OUTBOX_STATUS.FAILED).toArray();
}

/** Discard a rejected entry the user has chosen to give up on. */
export async function discard(seq) {
  const db = getDb();
  await db.outbox.delete(seq);
}

/** Retry a rejected entry — used after the user fixes whatever the server objected to. */
export async function retry(seq) {
  const db = getDb();
  await db.outbox.update(seq, {
    status: OUTBOX_STATUS.PENDING,
    attempts: 0,
    next_attempt_at: 0,
    last_error: null,
  });
}

/** Every pending patch for a record, oldest first — used to re-apply local edits over server data. */
export async function pendingPatchesFor(entity, entityId) {
  const db = getDb();
  const rows = await db.outbox
    .where('[entity+entity_id]')
    .equals([entity, entityId])
    .toArray();
  return rows.sort((a, b) => a.seq - b.seq);
}

export { MAX_ATTEMPTS };
