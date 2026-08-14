import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

import { openDb, destroyDb, getDb, getMeta, META, SYNC_STATE } from '../db';
import * as outbox from '../outbox';
import { customersRepo, jobsRepo } from '../repo';
// Imported statically, like every other module here. Loading it dynamically
// after vi.resetModules() would hand the engine its own private copy of db.js —
// one where no database is open — so every sync would silently do nothing.
import * as sync from '../sync';

// The sync engine's only contact with the outside world is these two calls, so
// the whole protocol can be exercised against a fake server.
const server = {
  push: vi.fn(),
  pull: vi.fn(),
};

vi.mock('../../api', () => ({
  sync: {
    push: (...args) => server.push(...args),
    pull: (...args) => server.pull(...args),
  },
}));

vi.mock('../session', () => ({
  touchOnline: () => {},
  markRevoked: () => {},
}));

const USER = '11111111-1111-4111-8111-111111111111';

beforeEach(async () => {
  server.push.mockReset();
  server.pull.mockReset();
  // Default: an empty server with nothing to send back.
  server.pull.mockResolvedValue({
    data: { entities: { customers: [], jobs: [] }, cursor: 'c1', has_more: false },
  });
  server.push.mockResolvedValue({ data: { results: [] } });

  await destroyDb(USER).catch(() => {});
  openDb(USER);
});

afterEach(async () => {
  // Cancels the debounce the repositories arm on every write, so a stray timer
  // can't fire a sync against the next test's database.
  sync.stopSync();
  await destroyDb(USER).catch(() => {});
});

const applied = (ops) => ({
  data: {
    results: ops.map((op) => ({ id: op.id, status: 'applied', record: op.__record || null })),
  },
});

describe('local writes', () => {
  it('saves a customer instantly and queues it, with no network at all', async () => {
    const customer = await customersRepo.create({ name: 'Amina Bello', phone: '+2348012345678' });

    expect(customer.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(customer._syncState).toBe(SYNC_STATE.PENDING);

    const stored = await customersRepo.get(customer.id);
    expect(stored.name).toBe('Amina Bello');

    const queued = await outbox.nextBatch();
    expect(queued).toHaveLength(1);
    expect(queued[0].op).toBe('create');
    expect(server.push).not.toHaveBeenCalled();
  });

  it('lets a job reference a customer that has never reached the server', async () => {
    const customer = await customersRepo.create({ name: 'Chidi Okafor' });
    const job = await jobsRepo.create({ customer_id: customer.id, title: 'Agbada', price: 45000 });

    const listed = await jobsRepo.list();
    expect(listed).toHaveLength(1);
    // The local join works because the customer's id was final from the moment
    // it was created, not assigned later by the server.
    expect(listed[0].customer_name).toBe('Chidi Okafor');
    expect(job.customer_id).toBe(customer.id);
  });
});

describe('outbox coalescing', () => {
  it('folds repeated edits into a single upload', async () => {
    const customer = await customersRepo.create({ name: 'Ngozi' });
    await customersRepo.update(customer.id, { phone: '+2348011111111' });
    await customersRepo.update(customer.id, { phone: '+2348022222222' });
    await customersRepo.update(customer.id, { location: 'Aba North' });

    const queued = await outbox.nextBatch();
    expect(queued).toHaveLength(1);
    expect(queued[0].op).toBe('create');
    expect(queued[0].patch).toMatchObject({
      name: 'Ngozi',
      phone: '+2348022222222',
      location: 'Aba North',
    });
  });

  it('uploads nothing for a record created and deleted while offline', async () => {
    const customer = await customersRepo.create({ name: 'Mistake' });
    await customersRepo.remove(customer.id);

    expect(await outbox.nextBatch()).toHaveLength(0);
  });

  it('never merges job status transitions', async () => {
    const customer = await customersRepo.create({ name: 'Tunde' });
    const job = await jobsRepo.create({ customer_id: customer.id, title: 'Kaftan' });
    await jobsRepo.setStatus(job.id, 'stitching');
    await jobsRepo.setStatus(job.id, 'ready');

    const statusOps = (await outbox.nextBatch()).filter((e) => e.op === 'status');
    // Merged, these would become a single cutting → ready jump, skipping a
    // notification the customer is expecting.
    expect(statusOps.map((e) => e.patch.status)).toEqual(['stitching', 'ready']);
  });

  it('replays a correction as its own op rather than folding it away', async () => {
    const customer = await customersRepo.create({ name: 'Bisi' });
    const job = await jobsRepo.create({ customer_id: customer.id, title: 'Gown' });

    // Marked delivered by mistake, then walked back to ready.
    await jobsRepo.setStatus(job.id, 'delivered');
    await jobsRepo.setStatus(job.id, 'ready');

    const statusOps = (await outbox.nextBatch()).filter((e) => e.op === 'status');
    // Both must reach the server: the first increments completed_jobs, the
    // second gives it back. Folded into one, the counter stays wrong forever.
    expect(statusOps.map((e) => e.patch.status)).toEqual(['delivered', 'ready']);
    expect((await jobsRepo.get(job.id)).delivered_at).toBeNull();
  });

  it('queues nothing when a job is set to the status it already has', async () => {
    const customer = await customersRepo.create({ name: 'Halima' });
    const job = await jobsRepo.create({ customer_id: customer.id, title: 'Buba' });
    await jobsRepo.setStatus(job.id, 'stitching');
    await jobsRepo.setStatus(job.id, 'stitching');

    const statusOps = (await outbox.nextBatch()).filter((e) => e.op === 'status');
    expect(statusOps).toHaveLength(1);
  });

  it('lets a job be marked paid at any stage, not only when ready', async () => {
    const customer = await customersRepo.create({ name: 'Emeka' });
    const job = await jobsRepo.create({ customer_id: customer.id, title: 'Senator' });

    // A deposit at the cutting stage is the normal case, not an error.
    await jobsRepo.setInvoiced(job.id, true);

    expect((await jobsRepo.get(job.id)).invoiced).toBe(true);
    const invoiceOps = (await outbox.nextBatch()).filter((e) => e.op === 'invoice');
    expect(invoiceOps.map((e) => e.patch.invoiced)).toEqual([true]);
  });
});

describe('push', () => {
  it('sends queued work in the order it was performed', async () => {
    const customer = await customersRepo.create({ name: 'Fatima' });
    await jobsRepo.create({ customer_id: customer.id, title: 'Abaya' });

    server.push.mockImplementation(async (ops) => applied(ops));
    await sync.syncNow('test');

    const sent = server.push.mock.calls[0][0];
    expect(sent[0].entity).toBe('customer');
    expect(sent[1].entity).toBe('job');
    // A job pushed before its customer would be rejected for a missing parent.
    expect(await outbox.nextBatch()).toHaveLength(0);
  });

  it('carries a stable idempotency key so a retry cannot duplicate a record', async () => {
    await customersRepo.create({ name: 'Duplicate Risk' });

    server.push.mockRejectedValueOnce(Object.assign(new Error('offline'), { code: 'NETWORK_ERROR' }));
    await sync.syncNow('first');

    const queued = await outbox.nextBatch(50);
    const idAfterFailure = (await getDb().outbox.orderBy('seq').first()).id;

    server.push.mockImplementation(async (ops) => applied(ops));
    // Clear the backoff the failure set, so the retry is attempted now.
    await getDb().outbox.toCollection().modify({ next_attempt_at: 0 });
    await sync.syncNow('second');

    expect(server.push.mock.calls[1][0][0].id).toBe(idAfterFailure);
  });

  it('keeps work queued when the network drops, without burning a retry', async () => {
    await customersRepo.create({ name: 'Still Here' });
    server.push.mockRejectedValue(Object.assign(new Error('offline'), { code: 'NETWORK_ERROR' }));

    await sync.syncNow('test');

    const entries = await getDb().outbox.toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe(outbox.OUTBOX_STATUS.PENDING);
    expect(entries[0].attempts).toBe(0);
  });

  it('quarantines a rejected op and flags the record, instead of retrying forever', async () => {
    const customer = await customersRepo.create({ name: '' });

    server.push.mockResolvedValue({
      data: {
        results: [{
          id: (await getDb().outbox.orderBy('seq').first()).id,
          status: 'rejected',
          error: { code: 'VALIDATION_ERROR', message: 'Name is required' },
        }],
      },
    });

    await sync.syncNow('test');

    const failures = await outbox.failedEntries();
    expect(failures).toHaveLength(1);
    expect(failures[0].last_error).toBe('Name is required');

    const row = await getDb().customers.get(customer.id);
    expect(row._syncState).toBe(SYNC_STATE.FAILED);
  });

  it('requeues entries stranded in-flight by a crash', async () => {
    await customersRepo.create({ name: 'Interrupted' });
    await getDb().outbox.toCollection().modify({ status: outbox.OUTBOX_STATUS.INFLIGHT });

    await outbox.resetStale();

    const entries = await getDb().outbox.toArray();
    expect(entries[0].status).toBe(outbox.OUTBOX_STATUS.PENDING);
  });
});

describe('pull', () => {
  it('stores server records and marks them synced', async () => {
    server.pull.mockResolvedValue({
      data: {
        entities: {
          customers: [{
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            name: 'From Server',
            phone: '+2348090000000',
            updated_at: '2026-08-01T10:00:00.000Z',
          }],
          jobs: [],
        },
        cursor: 'c2',
        has_more: false,
      },
    });

    await sync.syncNow('test');

    const stored = await customersRepo.get('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    expect(stored.name).toBe('From Server');
    expect(stored._syncState).toBe(SYNC_STATE.SYNCED);
    expect(await getMeta(META.CURSOR)).toBe('c2');
  });

  it('keeps unsent local edits on top of an incoming server version', async () => {
    const id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    await getDb().customers.put({
      id, name: 'Original', phone: '+234800', location: 'Ikeja',
      _deleted: 0, _syncState: SYNC_STATE.SYNCED,
    });

    // The tailor corrects the phone number offline...
    await customersRepo.update(id, { phone: '+2348099999999' });

    // ...meanwhile the same record was edited elsewhere, changing a different field.
    server.pull.mockResolvedValue({
      data: {
        entities: {
          customers: [{
            id, name: 'Original', phone: '+234800', location: 'Surulere',
            updated_at: '2026-08-02T10:00:00.000Z',
          }],
          jobs: [],
        },
        cursor: 'c3',
        has_more: false,
      },
    });
    server.push.mockRejectedValue(Object.assign(new Error('offline'), { code: 'NETWORK_ERROR' }));

    await sync.syncNow('test');

    const merged = await customersRepo.get(id);
    // Both edits survive: they touched different fields.
    expect(merged.phone).toBe('+2348099999999');
    expect(merged.location).toBe('Surulere');
  });

  it('hides a record the server reports as deleted', async () => {
    const id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    await getDb().customers.put({ id, name: 'Gone', _deleted: 0, _syncState: SYNC_STATE.SYNCED });

    server.pull.mockResolvedValue({
      data: {
        entities: {
          customers: [{ id, name: 'Gone', deleted_at: '2026-08-03T10:00:00.000Z' }],
          jobs: [],
        },
        cursor: 'c4',
        has_more: false,
      },
    });

    await sync.syncNow('test');

    expect(await customersRepo.get(id)).toBeNull();
    expect(await customersRepo.list()).toHaveLength(0);
  });

  it('follows has_more until the server runs out of pages', async () => {
    server.pull
      .mockResolvedValueOnce({
        data: {
          entities: { customers: [{ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', name: 'Page 1' }], jobs: [] },
          cursor: 'p1',
          has_more: true,
        },
      })
      .mockResolvedValueOnce({
        data: {
          entities: { customers: [{ id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', name: 'Page 2' }], jobs: [] },
          cursor: 'p2',
          has_more: false,
        },
      });

    await sync.syncNow('test');

    expect(await customersRepo.list()).toHaveLength(2);
    expect(server.pull.mock.calls[1][0].cursor).toBe('p1');
    expect(await getMeta(META.CURSOR)).toBe('p2');
  });
});

describe('a full offline day', () => {
  it('records work with no signal, then uploads all of it on reconnect', async () => {
    // Morning: no signal at all.
    server.push.mockRejectedValue(Object.assign(new Error('offline'), { code: 'NETWORK_ERROR' }));
    server.pull.mockRejectedValue(Object.assign(new Error('offline'), { code: 'NETWORK_ERROR' }));

    const amina = await customersRepo.create({ name: 'Amina', phone: '+2348010000001' });
    const chidi = await customersRepo.create({ name: 'Chidi', phone: '+2348010000002' });
    await customersRepo.saveMeasurements(amina.id, { chest: 38, waist: 32, notes: 'Prefers loose fit' });
    const job = await jobsRepo.create({ customer_id: amina.id, title: 'Wedding Agbada', price: 120000 });
    await jobsRepo.setStatus(job.id, 'stitching');
    await customersRepo.update(chidi.id, { location: 'Wuse' });

    await sync.syncNow('morning');

    // Everything is usable locally despite nothing having been uploaded.
    expect(await customersRepo.list()).toHaveLength(2);
    expect((await customersRepo.get(amina.id)).measurements.standard.chest).toBe(38);
    expect((await jobsRepo.get(job.id)).status).toBe('stitching');

    const queuedOps = await getDb().outbox.orderBy('seq').toArray();
    expect(queuedOps.length).toBeGreaterThan(0);

    // Evening: back in coverage.
    server.push.mockImplementation(async (ops) => applied(ops));
    server.pull.mockResolvedValue({
      data: { entities: { customers: [], jobs: [] }, cursor: 'done', has_more: false },
    });
    await getDb().outbox.toCollection().modify({ next_attempt_at: 0 });

    await sync.syncNow('evening');

    expect(await getDb().outbox.count()).toBe(0);
    expect(sync.getStatus().status).toBe('idle');
    // The tailor's work is intact and unchanged by the round trip.
    expect(await customersRepo.list()).toHaveLength(2);
    expect((await jobsRepo.get(job.id)).status).toBe('stitching');
  });
});
