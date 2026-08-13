import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';

import { openDb, destroyDb, getDb, SYNC_STATE } from '../db';
import { computeLocalAnalytics } from '../analytics';

const USER = '22222222-2222-4222-8222-222222222222';
const DAY = 24 * 60 * 60 * 1000;

const iso = (offsetDays) => new Date(Date.now() - offsetDays * DAY).toISOString();

function job(overrides) {
  return {
    id: crypto.randomUUID(),
    customer_id: null,
    title: 'Job',
    status: 'cutting',
    price: 0,
    due_date: null,
    delivered_at: null,
    created_at: iso(1),
    _deleted: 0,
    _syncState: SYNC_STATE.SYNCED,
    ...overrides,
  };
}

function customer(overrides) {
  return {
    id: crypto.randomUUID(),
    name: 'Customer',
    created_at: iso(1),
    _deleted: 0,
    _syncState: SYNC_STATE.SYNCED,
    ...overrides,
  };
}

beforeEach(async () => {
  await destroyDb(USER).catch(() => {});
  openDb(USER);
});

afterEach(async () => {
  await destroyDb(USER).catch(() => {});
});

describe('local analytics', () => {
  it('recognises revenue on delivery, and only within the window', async () => {
    const db = getDb();
    await db.jobs.bulkPut([
      job({ status: 'delivered', price: 50000, delivered_at: iso(5) }),
      job({ status: 'delivered', price: 30000, delivered_at: iso(10) }),
      // Delivered long ago — counts toward all-time but not a 30-day window.
      job({ status: 'delivered', price: 90000, delivered_at: iso(200) }),
      // Priced but not delivered: not revenue yet.
      job({ status: 'ready', price: 70000 }),
    ]);

    const out = await computeLocalAnalytics({ days: 30 });

    expect(out.revenue.window).toBe(80000);
    expect(out.revenue.allTime).toBe(170000);
    // Average is over delivered jobs only.
    expect(out.revenue.averageValue).toBe(Math.round(170000 / 3));
  });

  it('counts overdue jobs but never counts a delivered one as late', async () => {
    const db = getDb();
    const yesterday = new Date(Date.now() - DAY).toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + DAY).toISOString().slice(0, 10);

    await db.jobs.bulkPut([
      job({ status: 'cutting', due_date: yesterday }),
      job({ status: 'stitching', due_date: tomorrow }),
      // Past its date but already handed over — finished work is not overdue.
      job({ status: 'delivered', due_date: yesterday, delivered_at: iso(0) }),
    ]);

    const out = await computeLocalAnalytics();
    expect(out.jobs.overdue).toBe(1);
  });

  it('breaks jobs down by stage in pipeline order', async () => {
    const db = getDb();
    await db.jobs.bulkPut([
      job({ status: 'cutting' }),
      job({ status: 'cutting' }),
      job({ status: 'stitching' }),
      job({ status: 'ready' }),
      job({ status: 'delivered', delivered_at: iso(2) }),
    ]);

    const out = await computeLocalAnalytics();
    expect(out.jobs.stages.map((s) => [s.label, s.value])).toEqual([
      ['cutting', 2],
      ['stitching', 1],
      ['ready', 1],
      ['delivered', 1],
    ]);
    expect(out.jobs.active).toBe(3);
    expect(out.jobs.completionRate).toBe(20);
  });

  it('ranks top customers by delivered value and spots repeat business', async () => {
    const db = getDb();
    const amina = customer({ name: 'Amina' });
    const chidi = customer({ name: 'Chidi' });
    const quiet = customer({ name: 'Quiet' });
    await db.customers.bulkPut([amina, chidi, quiet]);

    await db.jobs.bulkPut([
      job({ customer_id: amina.id, status: 'delivered', price: 40000, delivered_at: iso(3) }),
      job({ customer_id: amina.id, status: 'delivered', price: 20000, delivered_at: iso(4) }),
      job({ customer_id: chidi.id, status: 'delivered', price: 50000, delivered_at: iso(5) }),
      // Undelivered work contributes nothing to spend.
      job({ customer_id: chidi.id, status: 'cutting', price: 999999 }),
      job({ customer_id: quiet.id, status: 'delivered', price: 1000, delivered_at: iso(200), created_at: iso(200) }),
    ]);

    const out = await computeLocalAnalytics({ days: 30 });

    expect(out.customers.total).toBe(3);
    expect(out.customers.topCustomers[0]).toEqual({ label: 'Amina', value: 60000 });
    expect(out.customers.topCustomers[1]).toEqual({ label: 'Chidi', value: 50000 });
    // Both Amina and Chidi have more than one job.
    expect(out.customers.returning).toBe(2);
    // Only the customer whose last job is over 90 days old.
    expect(out.customers.dormant.map((d) => d.name)).toEqual(['Quiet']);
  });

  it('ignores deleted rows entirely', async () => {
    const db = getDb();
    await db.jobs.bulkPut([
      job({ status: 'delivered', price: 10000, delivered_at: iso(1) }),
      job({ status: 'delivered', price: 99999, delivered_at: iso(1), _deleted: 1 }),
    ]);
    await db.customers.bulkPut([customer({ name: 'Gone', _deleted: 1 })]);

    const out = await computeLocalAnalytics();
    expect(out.revenue.allTime).toBe(10000);
    expect(out.customers.total).toBe(0);
  });

  it('returns a full six-month trend even when months had no deliveries', async () => {
    const db = getDb();
    await db.jobs.bulkPut([job({ status: 'delivered', price: 5000, delivered_at: iso(2) })]);

    const out = await computeLocalAnalytics();
    // Gaps are kept so a quiet month reads as a gap in the chart rather than
    // silently compressing the axis.
    expect(out.revenue.trend).toHaveLength(6);
    expect(out.revenue.trend.at(-1).value).toBe(5000);
  });

  it('reports no rates at all rather than a misleading zero on an empty account', async () => {
    const out = await computeLocalAnalytics();
    expect(out.revenue.allTime).toBe(0);
    // "0% complete" and "₦0 average" read as failure; there is simply no data.
    expect(out.jobs.completionRate).toBeNull();
    expect(out.revenue.averageValue).toBeNull();
  });
});
